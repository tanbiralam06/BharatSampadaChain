import request from 'supertest';
import app from '../src/app';
import { makeToken, HASH_A, HASH_B, MOCK_PROPERTY } from './helpers';

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
  syncProperty: jest.fn(),
}));

jest.mock('../src/fabric/contracts', () => ({
  registerProperty: jest.fn(),
  getProperty: jest.fn(),
  transferProperty: jest.fn(),
}));

import * as contracts from '../src/fabric/contracts';

const adminToken = makeToken('ADMIN');
const citizenToken = makeToken('CITIZEN', HASH_A);

const validRegisterBody = {
  propertyId: 'PROP-001',
  ownerHash: HASH_A,
  registrationNo: 'REG-2024-001',
  propertyType: 'RESIDENTIAL',
  declaredValue: 10000000,
  circleRateValue: 9000000,
  areaSqft: 1200,
  district: 'Pune',
  state: 'Maharashtra',
  registrationDate: '2024-01-01',
  transferType: 'PURCHASE',
  stampDutyPaid: 500000,
};

describe('POST /properties', () => {
  it('returns 403 for CITIZEN role', async () => {
    const res = await request(app)
      .post('/properties')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send(validRegisterBody);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid propertyType', async () => {
    const res = await request(app)
      .post('/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validRegisterBody, propertyType: 'INVALID' });
    expect(res.status).toBe(400);
  });

  it('returns 201 for ADMIN with valid body', async () => {
    (contracts.registerProperty as jest.Mock).mockResolvedValueOnce(MOCK_PROPERTY);
    const res = await request(app)
      .post('/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validRegisterBody);
    expect(res.status).toBe(201);
    expect(res.body.data.propertyId).toBe('PROP-001');
  });
});

describe('GET /properties/:id', () => {
  it('returns 200 for any authenticated user', async () => {
    (contracts.getProperty as jest.Mock).mockResolvedValueOnce(MOCK_PROPERTY);
    const res = await request(app)
      .get('/properties/PROP-001')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.ownerHash).toBe(HASH_A);
  });

  it('returns 500 when chaincode throws', async () => {
    (contracts.getProperty as jest.Mock).mockRejectedValueOnce(new Error('not found'));
    const res = await request(app)
      .get('/properties/PROP-999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(500);
  });
});

describe('PUT /properties/:id/transfer', () => {
  const validTransferBody = {
    newOwnerHash: HASH_B,
    transferType: 'PURCHASE',
    reason: 'Sale of property',
    transferValue: 12000000,
  };

  it('returns 403 for CITIZEN role', async () => {
    const res = await request(app)
      .put('/properties/PROP-001/transfer')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send(validTransferBody);
    expect(res.status).toBe(403);
  });

  it('returns 400 for negative transferValue', async () => {
    const res = await request(app)
      .put('/properties/PROP-001/transfer')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validTransferBody, transferValue: -100 });
    expect(res.status).toBe(400);
  });

  it('returns 200 with transfer record on success', async () => {
    const mockTransfer = {
      transferId: 'txfr-001', propertyId: 'PROP-001',
      fromOwnerHash: HASH_A, toOwnerHash: HASH_B,
      transferValue: 12000000, transferType: 'PURCHASE',
      transferDate: '2024-06-01', reason: 'Sale of property',
    };
    (contracts.transferProperty as jest.Mock).mockResolvedValueOnce(mockTransfer);
    (contracts.getProperty as jest.Mock).mockResolvedValueOnce({ ...MOCK_PROPERTY, ownerHash: HASH_B });
    const res = await request(app)
      .put('/properties/PROP-001/transfer')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validTransferBody);
    expect(res.status).toBe(200);
    expect(res.body.data.toOwnerHash).toBe(HASH_B);
  });
});
