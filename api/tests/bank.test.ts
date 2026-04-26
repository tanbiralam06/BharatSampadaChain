import request from 'supertest';
import app from '../src/app';
import { makeToken, HASH_A, MOCK_FLAG } from './helpers';

jest.mock('../src/fabric/connection', () => ({
  connectToFabric: jest.fn(),
  disconnectFabric: jest.fn(),
  getContract: jest.fn(),
}));

jest.mock('../src/db/client', () => ({
  db: { query: jest.fn(), on: jest.fn() },
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
}));

const mockSubmitManualFlag = jest.fn();
jest.mock('../src/fabric/contracts', () => ({
  submitManualFlag: (...args: unknown[]) => mockSubmitManualFlag(...args),
}));

const bankToken    = makeToken('BANK');
const itToken      = makeToken('IT_DEPT');
const courtToken   = makeToken('COURT');
const citizenToken = makeToken('CITIZEN', HASH_A);
const pubToken     = makeToken('PUBLIC');

const VALID_BODY = {
  discrepancyAmount: 500000,
  description: 'Loan repayment does not match declared income bracket',
  accountRef: 'SBI/HL/2024/001234',
};

beforeEach(() => {
  jest.resetAllMocks();
  mockSubmitManualFlag.mockResolvedValue({
    ...MOCK_FLAG,
    ruleTriggered: 'BANK_DISCREPANCY',
    severity: 'ORANGE',
  });
});

describe('POST /citizens/:hash/bank-flag — RBAC', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).post(`/citizens/${HASH_A}/bank-flag`).send(VALID_BODY);
    expect(res.status).toBe(401);
  });

  it('returns 403 for IT_DEPT', async () => {
    const res = await request(app).post(`/citizens/${HASH_A}/bank-flag`)
      .set('Authorization', `Bearer ${itToken}`).send(VALID_BODY);
    expect(res.status).toBe(403);
  });

  it('returns 403 for COURT', async () => {
    const res = await request(app).post(`/citizens/${HASH_A}/bank-flag`)
      .set('Authorization', `Bearer ${courtToken}`).send(VALID_BODY);
    expect(res.status).toBe(403);
  });

  it('returns 403 for CITIZEN', async () => {
    const res = await request(app).post(`/citizens/${HASH_A}/bank-flag`)
      .set('Authorization', `Bearer ${citizenToken}`).send(VALID_BODY);
    expect(res.status).toBe(403);
  });

  it('returns 403 for PUBLIC', async () => {
    const res = await request(app).post(`/citizens/${HASH_A}/bank-flag`)
      .set('Authorization', `Bearer ${pubToken}`).send(VALID_BODY);
    expect(res.status).toBe(403);
  });

  it('allows BANK role', async () => {
    const res = await request(app).post(`/citizens/${HASH_A}/bank-flag`)
      .set('Authorization', `Bearer ${bankToken}`).send(VALID_BODY);
    expect(res.status).toBe(201);
  });
});

describe('POST /citizens/:hash/bank-flag — validation', () => {
  it('returns 400 for missing discrepancyAmount', async () => {
    const res = await request(app).post(`/citizens/${HASH_A}/bank-flag`)
      .set('Authorization', `Bearer ${bankToken}`)
      .send({ description: 'valid description here', accountRef: 'SBI/001' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for zero discrepancyAmount', async () => {
    const res = await request(app).post(`/citizens/${HASH_A}/bank-flag`)
      .set('Authorization', `Bearer ${bankToken}`)
      .send({ ...VALID_BODY, discrepancyAmount: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for description too short', async () => {
    const res = await request(app).post(`/citizens/${HASH_A}/bank-flag`)
      .set('Authorization', `Bearer ${bankToken}`)
      .send({ ...VALID_BODY, description: 'too short' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing accountRef', async () => {
    const res = await request(app).post(`/citizens/${HASH_A}/bank-flag`)
      .set('Authorization', `Bearer ${bankToken}`)
      .send({ discrepancyAmount: 500000, description: 'valid description here' });
    expect(res.status).toBe(400);
  });
});

describe('POST /citizens/:hash/bank-flag — happy path', () => {
  it('creates flag with BANK_DISCREPANCY rule and returns 201', async () => {
    const res = await request(app).post(`/citizens/${HASH_A}/bank-flag`)
      .set('Authorization', `Bearer ${bankToken}`).send(VALID_BODY);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ruleTriggered).toBe('BANK_DISCREPANCY');
    expect(mockSubmitManualFlag).toHaveBeenCalledTimes(1);
  });

  it('prefixes description with accountRef', async () => {
    await request(app).post(`/citizens/${HASH_A}/bank-flag`)
      .set('Authorization', `Bearer ${bankToken}`).send(VALID_BODY);
    const call = mockSubmitManualFlag.mock.calls[0][0];
    expect(call.description).toContain(VALID_BODY.accountRef);
    expect(call.description).toContain(VALID_BODY.description);
  });

  it('stores discrepancyAmount as both assetValue and gapAmount', async () => {
    await request(app).post(`/citizens/${HASH_A}/bank-flag`)
      .set('Authorization', `Bearer ${bankToken}`).send(VALID_BODY);
    const call = mockSubmitManualFlag.mock.calls[0][0];
    expect(call.assetValue).toBe(VALID_BODY.discrepancyAmount);
    expect(call.gapAmount).toBe(VALID_BODY.discrepancyAmount);
  });
});
