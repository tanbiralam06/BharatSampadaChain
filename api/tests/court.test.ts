import request from 'supertest';
import app from '../src/app';
import { makeToken, MOCK_PROPERTY } from './helpers';

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

const mockFreeze   = jest.fn();
const mockUnfreeze = jest.fn();
const mockOrders   = jest.fn();

jest.mock('../src/fabric/contracts', () => ({
  freezeProperty:   (...args: unknown[]) => mockFreeze(...args),
  unfreezeProperty: (...args: unknown[]) => mockUnfreeze(...args),
  getCourtOrders:   (...args: unknown[]) => mockOrders(...args),
}));

const courtToken = makeToken('COURT');
const adminToken = makeToken('ADMIN');
const itToken    = makeToken('IT_DEPT');
const cbiToken   = makeToken('CBI');
const pubToken   = makeToken('PUBLIC');
const citizenToken = makeToken('CITIZEN');

const FROZEN_PROP   = { ...MOCK_PROPERTY, encumbrance: 'COURT_STAY' };
const UNFROZEN_PROP = { ...MOCK_PROPERTY, encumbrance: 'CLEAR'      };

const VALID_BODY = { orderRef: 'HC/2024/CR-1234', reason: 'Asset attachment order pending trial' };

beforeEach(() => {
  jest.resetAllMocks();
});

// ── POST /properties/:id/freeze ──────────────────────────────────────────────

describe('POST /properties/:id/freeze', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).post('/properties/PROP-001/freeze').send(VALID_BODY);
    expect(res.status).toBe(401);
  });

  it('returns 403 for IT_DEPT', async () => {
    const res = await request(app).post('/properties/PROP-001/freeze')
      .set('Authorization', `Bearer ${itToken}`).send(VALID_BODY);
    expect(res.status).toBe(403);
  });

  it('returns 403 for PUBLIC', async () => {
    const res = await request(app).post('/properties/PROP-001/freeze')
      .set('Authorization', `Bearer ${pubToken}`).send(VALID_BODY);
    expect(res.status).toBe(403);
  });

  it('returns 400 for missing orderRef', async () => {
    mockFreeze.mockResolvedValue(FROZEN_PROP);
    const res = await request(app).post('/properties/PROP-001/freeze')
      .set('Authorization', `Bearer ${courtToken}`).send({ reason: 'valid reason here' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for reason too short', async () => {
    mockFreeze.mockResolvedValue(FROZEN_PROP);
    const res = await request(app).post('/properties/PROP-001/freeze')
      .set('Authorization', `Bearer ${courtToken}`).send({ orderRef: 'HC/2024/001', reason: 'ok' });
    expect(res.status).toBe(400);
  });

  it('freezes property for COURT role', async () => {
    mockFreeze.mockResolvedValue(FROZEN_PROP);
    const res = await request(app).post('/properties/PROP-001/freeze')
      .set('Authorization', `Bearer ${courtToken}`).send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.encumbrance).toBe('COURT_STAY');
    expect(mockFreeze).toHaveBeenCalledTimes(1);
  });
});

// ── POST /properties/:id/unfreeze ────────────────────────────────────────────

describe('POST /properties/:id/unfreeze', () => {
  it('returns 403 for non-COURT roles', async () => {
    const res = await request(app).post('/properties/PROP-001/unfreeze')
      .set('Authorization', `Bearer ${adminToken}`).send(VALID_BODY);
    expect(res.status).toBe(403);
  });

  it('unfreezes property for COURT role', async () => {
    mockUnfreeze.mockResolvedValue(UNFROZEN_PROP);
    const res = await request(app).post('/properties/PROP-001/unfreeze')
      .set('Authorization', `Bearer ${courtToken}`).send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.data.encumbrance).toBe('CLEAR');
    expect(mockUnfreeze).toHaveBeenCalledTimes(1);
  });
});

// ── GET /properties/:id/court-orders ─────────────────────────────────────────

describe('GET /properties/:id/court-orders', () => {
  const MOCK_ORDER = {
    orderId: 'F-PROP0001-abc12345', propertyId: 'PROP-001',
    orderRef: 'HC/2024/CR-1234', orderType: 'FREEZE',
    issuedBy: 'court' + '0'.repeat(57), reason: 'Asset attachment',
    timestamp: '2024-06-01T10:00:00Z',
  };

  it('returns 403 for CITIZEN role', async () => {
    const res = await request(app).get('/properties/PROP-001/court-orders')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for PUBLIC role', async () => {
    const res = await request(app).get('/properties/PROP-001/court-orders')
      .set('Authorization', `Bearer ${pubToken}`);
    expect(res.status).toBe(403);
  });

  it('returns orders for COURT role', async () => {
    mockOrders.mockResolvedValue([MOCK_ORDER]);
    const res = await request(app).get('/properties/PROP-001/court-orders')
      .set('Authorization', `Bearer ${courtToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].orderType).toBe('FREEZE');
  });

  it('returns orders for IT_DEPT role', async () => {
    mockOrders.mockResolvedValue([MOCK_ORDER]);
    const res = await request(app).get('/properties/PROP-001/court-orders')
      .set('Authorization', `Bearer ${itToken}`);
    expect(res.status).toBe(200);
  });

  it('returns orders for CBI role', async () => {
    mockOrders.mockResolvedValue([]);
    const res = await request(app).get('/properties/PROP-001/court-orders')
      .set('Authorization', `Bearer ${cbiToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
