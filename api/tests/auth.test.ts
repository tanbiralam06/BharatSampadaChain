import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { makeToken } from './helpers';

jest.mock('../src/fabric/connection', () => ({
  connectToFabric: jest.fn(),
  disconnectFabric: jest.fn(),
  getContract: jest.fn(),
}));

jest.mock('../src/cache/redis', () => ({
  redis: { connect: jest.fn(), ping: jest.fn().mockResolvedValue('PONG'), on: jest.fn() },
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn(),
  invalidateCache: jest.fn(),
}));

const mockQueryOne = jest.fn();
jest.mock('../src/db/client', () => ({
  db: { query: jest.fn(), on: jest.fn() },
  query: jest.fn(),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
}));

const VALID_HASH = 'abc123' + '0'.repeat(58);

describe('POST /auth/login', () => {
  it('returns 400 when body is invalid', async () => {
    const res = await request(app).post('/auth/login').send({ identifier: '', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when user not found', async () => {
    mockQueryOne.mockResolvedValueOnce(null);
    const res = await request(app).post('/auth/login').send({
      identifier: VALID_HASH, password: 'password123', role: 'IT_DEPT',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 when password is wrong', async () => {
    const hash = await bcrypt.hash('correctpassword', 10);
    mockQueryOne.mockResolvedValueOnce({
      subject_hash: VALID_HASH, name: 'Test Officer', password_hash: hash, role: 'IT_DEPT',
    });
    const res = await request(app).post('/auth/login').send({
      identifier: VALID_HASH, password: 'wrongpassword', role: 'IT_DEPT',
    });
    expect(res.status).toBe(401);
  });

  it('returns 200 with token on success', async () => {
    const hash = await bcrypt.hash('password123', 10);
    mockQueryOne.mockResolvedValueOnce({
      subject_hash: VALID_HASH, name: 'Test Officer', password_hash: hash, role: 'IT_DEPT',
    });
    const res = await request(app).post('/auth/login').send({
      identifier: VALID_HASH, password: 'password123', role: 'IT_DEPT',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.role).toBe('IT_DEPT');
  });
});

describe('Auth middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/citizens/' + 'a'.repeat(64));
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is invalid', async () => {
    const res = await request(app)
      .get('/citizens/' + 'a'.repeat(64))
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('returns non-401 when valid token is provided (route logic kicks in)', async () => {
    const token = makeToken('ADMIN');
    const res = await request(app)
      .get('/citizens/' + 'a'.repeat(64))
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).not.toBe(401);
  });
});
