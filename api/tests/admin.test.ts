import request from 'supertest';
import app from '../src/app';
import { makeToken } from './helpers';

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
  redis: {
    connect: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
  },
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn(),
  invalidateCache: jest.fn(),
}));

const adminToken = makeToken('ADMIN');
const officerToken = makeToken('IT_DEPT');

describe('GET /admin/health', () => {
  it('returns 403 for non-ADMIN', async () => {
    const res = await request(app)
      .get('/admin/health')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns healthy when both services are up', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
    const res = await request(app)
      .get('/admin/health')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.services.redis).toBe('up');
  });

  it('returns degraded when postgres is down', async () => {
    mockDbQuery.mockRejectedValueOnce(new Error('connection refused'));
    const res = await request(app)
      .get('/admin/health')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('degraded');
    expect(res.body.data.services.postgres).toBe('down');
  });
});

describe('GET /admin/stats', () => {
  it('returns 403 for non-ADMIN', async () => {
    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns counts from DB', async () => {
    mockDbQuery
      .mockResolvedValueOnce({ rows: [{ count: '42' }] })
      .mockResolvedValueOnce({ rows: [{ count: '15' }] })
      .mockResolvedValueOnce({ rows: [{ count: '3' }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalCitizens).toBe(42);
    expect(res.body.data.totalProperties).toBe(15);
    expect(res.body.data.openFlags).toBe(3);
    expect(res.body.data.redFlags).toBe(1);
  });
});
