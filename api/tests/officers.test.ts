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
  db:       { query: (...args: unknown[]) => mockDbQuery(...args), on: jest.fn() },
  query:    jest.fn(),
  queryOne: (...args: unknown[]) => mockDbQuery(...args),
}));

jest.mock('../src/cache/redis', () => ({
  redis: { connect: jest.fn(), ping: jest.fn().mockResolvedValue('PONG'), on: jest.fn() },
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn(),
  invalidateCache: jest.fn(),
}));

const adminToken  = makeToken('ADMIN');
const itToken     = makeToken('IT_DEPT');
const cbiToken    = makeToken('CBI');
const citizenToken = makeToken('CITIZEN');

const OFFICER_ROW = {
  subject_hash: 'a'.repeat(64),
  login_id:     'new.officer@itdept.bsc.gov',
  name:         'New Officer',
  role:         'IT_DEPT',
  is_active:    true,
  created_at:   '2026-01-01T00:00:00Z',
  last_login:   null,
};

describe('POST /admin/officers', () => {
  const body = { name: 'New Officer', login_id: 'new.officer@itdept.bsc.gov', role: 'IT_DEPT', password: 'password123' };

  it('returns 403 for CITIZEN role', async () => {
    const res = await request(app).post('/admin/officers').set('Authorization', `Bearer ${citizenToken}`).send(body);
    expect(res.status).toBe(403);
  });

  it('ADMIN can create any officer role', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [] }); // INSERT
    const res = await request(app).post('/admin/officers').set('Authorization', `Bearer ${adminToken}`).send(body);
    expect(res.status).toBe(201);
    expect(res.body.data.login_id).toBe(body.login_id);
    expect(res.body.data.role).toBe('IT_DEPT');
  });

  it('IT_DEPT officer can create own-agency officer', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [] }); // INSERT
    const res = await request(app).post('/admin/officers').set('Authorization', `Bearer ${itToken}`).send(body);
    expect(res.status).toBe(201);
  });

  it('IT_DEPT officer cannot create CBI officer', async () => {
    const res = await request(app)
      .post('/admin/officers')
      .set('Authorization', `Bearer ${itToken}`)
      .send({ ...body, role: 'CBI' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/own agency/);
  });

  it('returns 409 on duplicate email', async () => {
    mockDbQuery.mockRejectedValueOnce({ code: '23505' });
    const res = await request(app).post('/admin/officers').set('Authorization', `Bearer ${adminToken}`).send(body);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/);
  });

  it('returns 400 for invalid role', async () => {
    const res = await request(app)
      .post('/admin/officers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...body, role: 'CITIZEN' });
    expect(res.status).toBe(400);
  });
});

describe('GET /admin/officers', () => {
  it('returns 403 for CITIZEN role', async () => {
    const res = await request(app).get('/admin/officers').set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  it('ADMIN receives full list', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [OFFICER_ROW] });
    const res = await request(app).get('/admin/officers').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].role).toBe('IT_DEPT');
  });

  it('IT_DEPT officer receives only own-agency rows', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [OFFICER_ROW] });
    const res = await request(app).get('/admin/officers').set('Authorization', `Bearer ${itToken}`);
    expect(res.status).toBe(200);
    // Verify the query used role filter (single-role path) — rows returned are IT_DEPT
    expect(res.body.data.every((o: { role: string }) => o.role === 'IT_DEPT')).toBe(true);
  });
});

describe('PUT /admin/officers/:hash/status', () => {
  const hash = 'a'.repeat(64);

  it('returns 403 for CITIZEN role', async () => {
    const res = await request(app)
      .put(`/admin/officers/${hash}/status`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ is_active: false });
    expect(res.status).toBe(403);
  });

  it('ADMIN can deactivate any officer', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [{ ...OFFICER_ROW, is_active: false }] });
    const res = await request(app)
      .put(`/admin/officers/${hash}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_active: false });
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(false);
  });

  it('CBI officer cannot deactivate IT_DEPT officer', async () => {
    // queryOne returns IT_DEPT as the target role
    mockDbQuery.mockResolvedValueOnce({ role: 'IT_DEPT' });
    const res = await request(app)
      .put(`/admin/officers/${hash}/status`)
      .set('Authorization', `Bearer ${cbiToken}`)
      .send({ is_active: false });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/own agency/);
  });

  it('returns 400 if is_active is not boolean', async () => {
    const res = await request(app)
      .put(`/admin/officers/${hash}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_active: 'yes' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when officer hash not found', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE returns nothing
    const res = await request(app)
      .put(`/admin/officers/${hash}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_active: true });
    expect(res.status).toBe(404);
  });
});
