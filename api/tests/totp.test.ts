import request from 'supertest';
import app from '../src/app';
import { makeToken } from './helpers';

// ── mocks ─────────────────────────────────────────────────────────────────────

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

// Fixed secret/code for deterministic tests
const FAKE_SECRET  = 'JBSWY3DPEHPK3PXP';
const FAKE_CODE    = '123456';
const FAKE_QR_URL  = 'data:image/png;base64,fake';

jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
    keyuri:         jest.fn().mockReturnValue('otpauth://totp/BSC%20Admin%20Panel:Admin?secret=JBSWY3DPEHPK3PXP&issuer=BSC%20Admin%20Panel'),
    verify:         jest.fn(), // controlled per-test
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,fake'),
}));

import { authenticator } from 'otplib';
const mockVerify = authenticator.verify as jest.Mock;

const adminToken = makeToken('ADMIN');
const ADMIN_HASH = 'aabbcc' + 'ADMIN'.toLowerCase().padEnd(58, '0');

// ── POST /auth/login (TOTP path) ──────────────────────────────────────────────

describe('POST /auth/login — TOTP gate', () => {
  it('returns full JWT when TOTP is not enabled', async () => {
    mockDbQuery.mockResolvedValueOnce({
      subject_hash: ADMIN_HASH, name: 'BSC Admin', role: 'ADMIN', totp_enabled: false,
      password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    });
    const res = await request(app).post('/auth/login').send({ identifier: 'admin', password: 'password', role: 'ADMIN' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.step).toBeUndefined();
  });

  it('returns challenge token when TOTP is enabled', async () => {
    mockDbQuery.mockResolvedValueOnce({
      subject_hash: ADMIN_HASH, name: 'BSC Admin', role: 'ADMIN', totp_enabled: true,
      password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    });
    const res = await request(app).post('/auth/login').send({ identifier: 'admin', password: 'password', role: 'ADMIN' });
    expect(res.status).toBe(200);
    expect(res.body.data.step).toBe('totp_required');
    expect(res.body.data.challenge_token).toBeDefined();
    expect(res.body.data.token).toBeUndefined();
  });
});

// ── POST /auth/totp/setup ─────────────────────────────────────────────────────

describe('POST /auth/totp/setup', () => {
  it('returns 403 for non-ADMIN', async () => {
    const officerToken = makeToken('IT_DEPT');
    const res = await request(app).post('/auth/totp/setup').set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(403);
  });

  it('generates secret, stores it, returns uri and qrCode', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE
    const res = await request(app).post('/auth/totp/setup').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.uri).toMatch(/^otpauth:\/\//);
    expect(res.body.data.qrCode).toBe(FAKE_QR_URL);
  });
});

// ── POST /auth/totp/verify-setup ──────────────────────────────────────────────

describe('POST /auth/totp/verify-setup', () => {
  it('returns 401 for wrong code', async () => {
    mockDbQuery.mockResolvedValueOnce({ totp_secret: FAKE_SECRET });
    mockVerify.mockReturnValueOnce(false);
    const res = await request(app)
      .post('/auth/totp/verify-setup')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: '000000' });
    expect(res.status).toBe(401);
  });

  it('enables TOTP on correct code', async () => {
    mockDbQuery
      .mockResolvedValueOnce({ totp_secret: FAKE_SECRET }) // queryOne
      .mockResolvedValueOnce({ rows: [] });                // UPDATE
    mockVerify.mockReturnValueOnce(true);
    const res = await request(app)
      .post('/auth/totp/verify-setup')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: FAKE_CODE });
    expect(res.status).toBe(200);
    expect(res.body.data.enabled).toBe(true);
  });

  it('returns 400 if setup was never initiated', async () => {
    mockDbQuery.mockResolvedValueOnce({ totp_secret: null });
    const res = await request(app)
      .post('/auth/totp/verify-setup')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: FAKE_CODE });
    expect(res.status).toBe(400);
  });
});

// ── POST /auth/totp/verify ────────────────────────────────────────────────────

describe('POST /auth/totp/verify', () => {
  // Build a real challenge token to use in these tests
  let challengeToken: string;
  beforeAll(async () => {
    mockDbQuery.mockResolvedValueOnce({
      subject_hash: ADMIN_HASH, name: 'BSC Admin', role: 'ADMIN', totp_enabled: true,
      password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    });
    const loginRes = await request(app).post('/auth/login').send({ identifier: 'admin', password: 'password', role: 'ADMIN' });
    challengeToken = loginRes.body.data.challenge_token;
  });

  it('returns 401 for bad code', async () => {
    mockDbQuery.mockResolvedValueOnce({ totp_secret: FAKE_SECRET, totp_enabled: true, name: 'BSC Admin' });
    mockVerify.mockReturnValueOnce(false);
    const res = await request(app).post('/auth/totp/verify').send({ challenge_token: challengeToken, code: '000000' });
    expect(res.status).toBe(401);
  });

  it('issues full JWT on correct code', async () => {
    mockDbQuery.mockResolvedValueOnce({ totp_secret: FAKE_SECRET, totp_enabled: true, name: 'BSC Admin' });
    mockVerify.mockReturnValueOnce(true);
    const res = await request(app).post('/auth/totp/verify').send({ challenge_token: challengeToken, code: FAKE_CODE });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.role).toBe('ADMIN');
  });

  it('returns 401 for tampered challenge token', async () => {
    const res = await request(app).post('/auth/totp/verify').send({ challenge_token: 'garbage', code: FAKE_CODE });
    expect(res.status).toBe(401);
  });
});

// ── POST /auth/totp/disable ───────────────────────────────────────────────────

describe('POST /auth/totp/disable', () => {
  it('returns 401 for wrong code', async () => {
    mockDbQuery.mockResolvedValueOnce({ totp_secret: FAKE_SECRET, totp_enabled: true });
    mockVerify.mockReturnValueOnce(false);
    const res = await request(app)
      .post('/auth/totp/disable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: '000000' });
    expect(res.status).toBe(401);
  });

  it('disables TOTP on correct code', async () => {
    mockDbQuery
      .mockResolvedValueOnce({ totp_secret: FAKE_SECRET, totp_enabled: true }) // queryOne
      .mockResolvedValueOnce({ rows: [] });                                     // UPDATE
    mockVerify.mockReturnValueOnce(true);
    const res = await request(app)
      .post('/auth/totp/disable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: FAKE_CODE });
    expect(res.status).toBe(200);
    expect(res.body.data.disabled).toBe(true);
  });

  it('returns 400 if TOTP is not enabled', async () => {
    mockDbQuery.mockResolvedValueOnce({ totp_secret: null, totp_enabled: false });
    const res = await request(app)
      .post('/auth/totp/disable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: FAKE_CODE });
    expect(res.status).toBe(400);
  });
});

// ── GET /auth/totp/status ─────────────────────────────────────────────────────

describe('GET /auth/totp/status', () => {
  it('returns enabled: false when not enrolled', async () => {
    mockDbQuery.mockResolvedValueOnce({ totp_enabled: false });
    const res = await request(app).get('/auth/totp/status').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.enabled).toBe(false);
  });

  it('returns enabled: true when enrolled', async () => {
    mockDbQuery.mockResolvedValueOnce({ totp_enabled: true });
    const res = await request(app).get('/auth/totp/status').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.enabled).toBe(true);
  });
});
