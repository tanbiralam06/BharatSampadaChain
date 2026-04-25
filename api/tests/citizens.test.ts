import request from 'supertest';
import app from '../src/app';
import { makeToken, HASH_A, HASH_B, MOCK_CITIZEN, MOCK_FLAG, MOCK_ACCESS_LOG, MOCK_PROPERTY } from './helpers';

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
  syncCitizen: jest.fn(),
  syncFlags: jest.fn(),
  syncAccessLog: jest.fn(),
  notifyOfficerAccess: jest.fn(),
}));

jest.mock('../src/fabric/contracts', () => ({
  getCitizenNode: jest.fn(),
  createCitizenNode: jest.fn(),
  runAnomalyCheck: jest.fn(),
  getFlagsByCitizen: jest.fn(),
  getAccessLogsByCitizen: jest.fn(),
  getPropertiesByOwner: jest.fn(),
  logAccess: jest.fn(),
  updateCitizenAssets: jest.fn(),
}));

import * as contracts from '../src/fabric/contracts';

const citizenToken = makeToken('CITIZEN', HASH_A);
const officerToken = makeToken('IT_DEPT');
const adminToken = makeToken('ADMIN');

beforeEach(() => {
  (contracts.logAccess as jest.Mock).mockResolvedValue(MOCK_ACCESS_LOG);
  // Default so .catch() chains in service code never fail on undefined
  (contracts.getCitizenNode as jest.Mock).mockResolvedValue(MOCK_CITIZEN);
});

describe('GET /citizens/:hash', () => {
  it('returns 200 for ADMIN accessing any citizen', async () => {
    (contracts.getCitizenNode as jest.Mock).mockResolvedValueOnce(MOCK_CITIZEN);
    const res = await request(app)
      .get(`/citizens/${HASH_A}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.citizenHash).toBe(HASH_A);
  });

  it('returns 200 for CITIZEN accessing own profile', async () => {
    (contracts.getCitizenNode as jest.Mock).mockResolvedValueOnce(MOCK_CITIZEN);
    const res = await request(app)
      .get(`/citizens/${HASH_A}`)
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 403 for CITIZEN accessing another citizen', async () => {
    const res = await request(app)
      .get(`/citizens/${HASH_B}`)
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 500 when chaincode throws', async () => {
    (contracts.getCitizenNode as jest.Mock).mockRejectedValueOnce(new Error('ledger unavailable'));
    const res = await request(app)
      .get(`/citizens/${HASH_A}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(500);
  });
});

describe('POST /citizens', () => {
  const validBody = {
    citizenHash: HASH_A,
    panHash: 'c'.repeat(64),
    name: 'Test Citizen',
    dateOfBirth: '1990-01-01',
    aadhaarState: 'Maharashtra',
    citizenType: 'civilian',
    totalDeclaredAssets: 5000000,
    totalIncome5Yr: 3000000,
    prevYearAssets: 4500000,
    assets5YrAgo: 2000000,
  };

  it('returns 403 for CITIZEN role', async () => {
    const res = await request(app)
      .post('/citizens')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid body', async () => {
    const res = await request(app)
      .post('/citizens')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validBody, citizenType: 'invalid_type' });
    expect(res.status).toBe(400);
  });

  it('returns 201 on success for ADMIN', async () => {
    (contracts.createCitizenNode as jest.Mock).mockResolvedValueOnce(MOCK_CITIZEN);
    const res = await request(app)
      .post('/citizens')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.data.citizenHash).toBe(HASH_A);
  });
});

describe('POST /citizens/:hash/check-anomaly', () => {
  it('returns 403 for ED role', async () => {
    const edToken = makeToken('ED');
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-anomaly`)
      .set('Authorization', `Bearer ${edToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 200 with flag count for IT_DEPT', async () => {
    (contracts.runAnomalyCheck as jest.Mock).mockResolvedValueOnce([MOCK_FLAG]);
    const res = await request(app)
      .post(`/citizens/${HASH_A}/check-anomaly`)
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.flagsRaised).toBe(1);
  });
});

describe('GET /citizens/:hash/flags', () => {
  it('returns flags for officer', async () => {
    (contracts.getFlagsByCitizen as jest.Mock).mockResolvedValueOnce([MOCK_FLAG]);
    const res = await request(app)
      .get(`/citizens/${HASH_A}/flags`)
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /citizens/:hash/properties', () => {
  it('returns properties list', async () => {
    (contracts.getPropertiesByOwner as jest.Mock).mockResolvedValueOnce([MOCK_PROPERTY]);
    const res = await request(app)
      .get(`/citizens/${HASH_A}/properties`)
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
