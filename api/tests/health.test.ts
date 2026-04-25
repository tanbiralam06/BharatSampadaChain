import request from 'supertest';
import app from '../src/app';

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

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', version: '1.0.0' });
  });
});
