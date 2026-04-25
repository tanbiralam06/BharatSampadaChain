import jwt from 'jsonwebtoken';
import type { AccessorRole, CitizenNode, AnomalyFlag, PropertyRecord, AccessLog } from '../src/models';

const JWT_SECRET = 'dev_secret_change_in_production';

export function makeToken(role: AccessorRole, sub = 'aabbcc' + role.toLowerCase().padEnd(58, '0')): string {
  return jwt.sign({ sub, role, name: `Test ${role}` }, JWT_SECRET, { expiresIn: '1h' });
}

export const HASH_A = 'a'.repeat(64);
export const HASH_B = 'b'.repeat(64);
export const HASH_ADMIN = 'adm1n'.padEnd(64, '0');

export const MOCK_CITIZEN: CitizenNode = {
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
  anomalyScore: 0,
  lastUpdated: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
};

export const MOCK_FLAG: AnomalyFlag = {
  flagId: 'flag-001',
  citizenHash: HASH_A,
  ruleTriggered: 'ASSET_TO_INCOME_RATIO',
  severity: 'RED',
  description: 'Asset growth exceeds income by 300%',
  assetValueUsed: 5000000,
  incomeValueUsed: 1000000,
  gapAmount: 4000000,
  status: 'OPEN',
  raisedAt: '2024-01-01T00:00:00Z',
};

export const MOCK_PROPERTY: PropertyRecord = {
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
  encumbrance: 'CLEAR',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  lastUpdated: '2024-01-01T00:00:00Z',
};

export const MOCK_ACCESS_LOG: AccessLog = {
  logId: 'log-001',
  citizenHash: HASH_A,
  accessorHash: HASH_ADMIN,
  accessorRole: 'ADMIN',
  accessType: 'VIEW',
  dataTypes: ['INCOME_SUMMARY'],
  purpose: 'Profile view',
  timestamp: '2024-01-01T00:00:00Z',
  txId: 'tx-001',
};
