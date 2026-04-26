import request from 'supertest';
import app from '../src/app';
import { makeToken, HASH_A, MOCK_FLAG } from './helpers';

jest.mock('../src/fabric/connection', () => ({
  connectToFabric: jest.fn(),
  disconnectFabric: jest.fn(),
  getContract: jest.fn(),
}));

const mockDbQuery = jest.fn();
jest.mock('../src/db/client', () => ({
  db: { query: (...args: unknown[]) => mockDbQuery(...args), on: jest.fn() },
  query: jest.fn(),
  queryOne: jest.fn(),
}));

jest.mock('../src/cache/redis', () => ({
  redis: { connect: jest.fn(), ping: jest.fn().mockResolvedValue('PONG'), on: jest.fn() },
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn(),
  invalidateCache: jest.fn(),
}));

jest.mock('../src/db/sync', () => ({
  syncFlag: jest.fn(),
  syncFlags: jest.fn(),
  syncCitizen: jest.fn(),
}));

const mockSubmitManualFlag = jest.fn();
jest.mock('../src/fabric/contracts', () => ({
  submitManualFlag: (...args: unknown[]) => mockSubmitManualFlag(...args),
}));

const itToken    = makeToken('IT_DEPT');
const edToken    = makeToken('ED');
const cbiToken   = makeToken('CBI');
const adminToken = makeToken('ADMIN');
const pubToken   = makeToken('PUBLIC');
const citizenToken = makeToken('CITIZEN', HASH_A);

// Clean citizen row — no anomalies
const CLEAN_CITIZEN = { total_declared_assets: '1000000', total_income_5yr: '5000000', assets_5yr_ago: '500000' };
// Clean property stats — only 1 property, no transfers, no undervaluation
const CLEAN_PROPS = { total_count: '1', transferred_count: '0', undervalued_count: '0', total_declared_value: '1000000', total_circle_value: '900000' };

// Suspicious citizen — disproportionate wealth + unexplained surge
const RISKY_CITIZEN = { total_declared_assets: '100000000', total_income_5yr: '1000000', assets_5yr_ago: '2000000' };
// Suspicious properties — 3 transferred + 2 of 3 undervalued
const RISKY_PROPS = { total_count: '3', transferred_count: '3', undervalued_count: '2', total_declared_value: '3000000', total_circle_value: '9000000' };

beforeEach(() => {
  jest.resetAllMocks();
  mockSubmitManualFlag.mockResolvedValue({ ...MOCK_FLAG, flagId: 'benami-001', ruleTriggered: 'PROXY_OWNERSHIP_PATTERN' });
});

describe('POST /citizens/:hash/check-benami — RBAC', () => {
  beforeEach(() => {
    mockDbQuery
      .mockResolvedValueOnce({ rows: [CLEAN_CITIZEN] })
      .mockResolvedValueOnce({ rows: [CLEAN_PROPS]   });
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).post(`/citizens/${HASH_A}/check-benami`);
    expect(res.status).toBe(401);
  });

  it('returns 403 for CITIZEN role', async () => {
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-benami`)
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for PUBLIC role', async () => {
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-benami`)
      .set('Authorization', `Bearer ${pubToken}`);
    expect(res.status).toBe(403);
  });

  it('allows IT_DEPT', async () => {
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-benami`)
      .set('Authorization', `Bearer ${itToken}`);
    expect(res.status).toBe(200);
  });

  it('allows ED', async () => {
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-benami`)
      .set('Authorization', `Bearer ${edToken}`);
    expect(res.status).toBe(200);
  });

  it('allows CBI', async () => {
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-benami`)
      .set('Authorization', `Bearer ${cbiToken}`);
    expect(res.status).toBe(200);
  });

  it('allows ADMIN', async () => {
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-benami`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('POST /citizens/:hash/check-benami — clean citizen', () => {
  beforeEach(() => {
    mockDbQuery
      .mockResolvedValueOnce({ rows: [CLEAN_CITIZEN] })
      .mockResolvedValueOnce({ rows: [CLEAN_PROPS]   });
  });

  it('evaluates 4 rules and raises 0 flags', async () => {
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-benami`)
      .set('Authorization', `Bearer ${itToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rulesEvaluated).toBe(4);
    expect(res.body.data.flagsRaised).toBe(0);
    expect(res.body.data.flags).toHaveLength(0);
    expect(mockSubmitManualFlag).not.toHaveBeenCalled();
  });

  it('returns ruleDetails with triggered=false for all rules', async () => {
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-benami`)
      .set('Authorization', `Bearer ${itToken}`);
    const details = res.body.data.ruleDetails as Array<{ triggered: boolean }>;
    expect(details.every((r) => r.triggered === false)).toBe(true);
  });
});

describe('POST /citizens/:hash/check-benami — risky citizen', () => {
  beforeEach(() => {
    mockDbQuery
      .mockResolvedValueOnce({ rows: [RISKY_CITIZEN] })
      .mockResolvedValueOnce({ rows: [RISKY_PROPS]   });
  });

  it('raises flags for all 4 triggered rules and calls submitManualFlag', async () => {
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-benami`)
      .set('Authorization', `Bearer ${itToken}`);
    expect(res.status).toBe(200);
    // All 4 rules should trigger for this citizen
    expect(res.body.data.flagsRaised).toBe(4);
    expect(mockSubmitManualFlag).toHaveBeenCalledTimes(4);
  });

  it('includes triggered rule codes in ruleDetails', async () => {
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-benami`)
      .set('Authorization', `Bearer ${itToken}`);
    const codes = res.body.data.ruleDetails.map((r: { ruleCode: string }) => r.ruleCode);
    expect(codes).toContain('PROXY_OWNERSHIP_PATTERN');
    expect(codes).toContain('SYSTEMATIC_UNDERVALUATION');
    expect(codes).toContain('DISPROPORTIONATE_ASSETS');
    expect(codes).toContain('UNEXPLAINED_5YR_SURGE');
  });
});

describe('POST /citizens/:hash/check-benami — not found', () => {
  it('returns 404 when citizen does not exist', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-benami`)
      .set('Authorization', `Bearer ${itToken}`);
    expect(res.status).toBe(404);
  });
});
