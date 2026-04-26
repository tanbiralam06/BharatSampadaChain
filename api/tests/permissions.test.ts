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

// Mock the permission service so tests don't need Fabric or DB setup
const mockGetAllPermissions = jest.fn();
const mockUpdatePermission  = jest.fn();
jest.mock('../src/services/permission.service', () => ({
  getAllPermissions: (...args: unknown[]) => mockGetAllPermissions(...args),
  updatePermission:  (...args: unknown[]) => mockUpdatePermission(...args),
}));

const adminToken   = makeToken('ADMIN');
const itToken      = makeToken('IT_DEPT');
const citizenToken = makeToken('CITIZEN');

const SAMPLE_RULES = [
  { accessorRole: 'CITIZEN', allowedDataTypes: ['ALL'],                                             requiresAuthorizationRef: false },
  { accessorRole: 'IT_DEPT', allowedDataTypes: ['INCOME_SUMMARY', 'ASSET_SUMMARY'],                 requiresAuthorizationRef: true  },
  { accessorRole: 'CBI',     allowedDataTypes: ['ALL'],                                             requiresAuthorizationRef: true  },
];

describe('GET /admin/permissions', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/admin/permissions');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-ADMIN roles', async () => {
    const res = await request(app)
      .get('/admin/permissions')
      .set('Authorization', `Bearer ${itToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for CITIZEN', async () => {
    const res = await request(app)
      .get('/admin/permissions')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  it('ADMIN receives full permission matrix', async () => {
    mockGetAllPermissions.mockResolvedValueOnce(SAMPLE_RULES);
    const res = await request(app)
      .get('/admin/permissions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].accessorRole).toBe('CITIZEN');
  });

  it('propagates service errors as 500', async () => {
    mockGetAllPermissions.mockRejectedValueOnce(new Error('DB unavailable'));
    const res = await request(app)
      .get('/admin/permissions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(500);
  });
});

describe('PUT /admin/permissions/:role', () => {
  const validBody = { dataTypes: ['INCOME_SUMMARY', 'ASSET_SUMMARY'], requiresRef: true };

  it('requires authentication', async () => {
    const res = await request(app).put('/admin/permissions/IT_DEPT').send(validBody);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-ADMIN roles', async () => {
    const res = await request(app)
      .put('/admin/permissions/IT_DEPT')
      .set('Authorization', `Bearer ${itToken}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });

  it('returns 400 for unknown role', async () => {
    const res = await request(app)
      .put('/admin/permissions/UNKNOWN_ROLE')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Unknown role/);
  });

  it('returns 400 when dataTypes is empty', async () => {
    const res = await request(app)
      .put('/admin/permissions/IT_DEPT')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ dataTypes: [], requiresRef: true });
    expect(res.status).toBe(400);
  });

  it('returns 400 when requiresRef is missing', async () => {
    const res = await request(app)
      .put('/admin/permissions/IT_DEPT')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ dataTypes: ['INCOME_SUMMARY'] });
    expect(res.status).toBe(400);
  });

  it('ADMIN can update a role permission rule', async () => {
    const updated = { accessorRole: 'IT_DEPT', allowedDataTypes: ['INCOME_SUMMARY', 'ASSET_SUMMARY'], requiresAuthorizationRef: true };
    mockUpdatePermission.mockResolvedValueOnce(updated);
    const res = await request(app)
      .put('/admin/permissions/IT_DEPT')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.data.accessorRole).toBe('IT_DEPT');
    expect(mockUpdatePermission).toHaveBeenCalledWith('IT_DEPT', ['INCOME_SUMMARY', 'ASSET_SUMMARY'], true);
  });

  it('can update PUBLIC role (no requiresRef)', async () => {
    const updated = { accessorRole: 'PUBLIC', allowedDataTypes: ['OFFICIAL_WEALTH_SUMMARY'], requiresAuthorizationRef: false };
    mockUpdatePermission.mockResolvedValueOnce(updated);
    const res = await request(app)
      .put('/admin/permissions/PUBLIC')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ dataTypes: ['OFFICIAL_WEALTH_SUMMARY'], requiresRef: false });
    expect(res.status).toBe(200);
    expect(res.body.data.requiresAuthorizationRef).toBe(false);
  });

  it('propagates service errors as 500', async () => {
    mockUpdatePermission.mockRejectedValueOnce(new Error('Fabric write failed'));
    const res = await request(app)
      .put('/admin/permissions/CBI')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);
    expect(res.status).toBe(500);
  });
});
