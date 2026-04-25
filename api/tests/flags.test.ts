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
}));

jest.mock('../src/fabric/contracts', () => ({
  getFlagsBySeverity: jest.fn(),
  updateFlagStatus: jest.fn(),
  submitManualFlag: jest.fn(),
}));

import * as contracts from '../src/fabric/contracts';

const officerToken = makeToken('IT_DEPT');
const adminToken = makeToken('ADMIN');
const citizenToken = makeToken('CITIZEN', HASH_A);

beforeEach(() => {
  mockDbQuery.mockResolvedValue({ rows: [], rowCount: 1 });
});

describe('GET /flags', () => {
  it('returns 403 for CITIZEN role', async () => {
    const res = await request(app)
      .get('/flags')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  it('returns all flags for ADMIN', async () => {
    (contracts.getFlagsBySeverity as jest.Mock)
      .mockResolvedValueOnce([MOCK_FLAG])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const res = await request(app)
      .get('/flags')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns filtered flags by severity', async () => {
    (contracts.getFlagsBySeverity as jest.Mock).mockResolvedValueOnce([MOCK_FLAG]);
    const res = await request(app)
      .get('/flags?severity=RED')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(contracts.getFlagsBySeverity).toHaveBeenCalledWith('RED');
  });
});

describe('PUT /flags/:id', () => {
  it('returns 400 for invalid status', async () => {
    const res = await request(app)
      .put('/flags/flag-001')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'INVALID_STATUS' });
    expect(res.status).toBe(400);
  });

  it('returns 200 and updates status', async () => {
    (contracts.updateFlagStatus as jest.Mock).mockResolvedValueOnce(undefined);
    const res = await request(app)
      .put('/flags/flag-001')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'UNDER_INVESTIGATION', resolutionNotes: 'Looking into it' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('syncs status to DB on CLEARED', async () => {
    (contracts.updateFlagStatus as jest.Mock).mockResolvedValueOnce(undefined);
    await request(app)
      .put('/flags/flag-001')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'CLEARED', resolutionNotes: 'No issue found' });
    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE anomaly_flags'),
      expect.arrayContaining(['CLEARED', 'No issue found'])
    );
  });
});

describe('POST /flags/manual', () => {
  it('returns 403 for ADMIN (not an investigator)', async () => {
    const res = await request(app)
      .post('/flags/manual')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        citizenHash: HASH_A, ruleTriggered: 'BENAMI_SUSPICION',
        severity: 'RED', description: 'Suspicious property chain detected here',
        assetValue: 5000000, incomeValue: 1000000, gapAmount: 4000000,
      });
    expect(res.status).toBe(403);
  });

  it('returns 201 on success for IT_DEPT', async () => {
    (contracts.submitManualFlag as jest.Mock).mockResolvedValueOnce(MOCK_FLAG);
    const res = await request(app)
      .post('/flags/manual')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        citizenHash: HASH_A, ruleTriggered: 'BENAMI_SUSPICION',
        severity: 'RED', description: 'Suspicious property chain detected here',
        assetValue: 5000000, incomeValue: 1000000, gapAmount: 4000000,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.flagId).toBe('flag-001');
  });
});
