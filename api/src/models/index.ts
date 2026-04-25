export type CitizenType = 'civilian' | 'government_official' | 'politician';
export type Severity = 'YELLOW' | 'ORANGE' | 'RED';
export type FlagStatus = 'OPEN' | 'UNDER_INVESTIGATION' | 'CLEARED' | 'ESCALATED';
export type AccessorRole = 'CITIZEN' | 'IT_DEPT' | 'ED' | 'CBI' | 'COURT' | 'BANK' | 'ADMIN' | 'PUBLIC';
export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'AGRICULTURAL' | 'INDUSTRIAL' | 'PLOT';
export type Encumbrance = 'CLEAR' | 'MORTGAGED' | 'DISPUTED' | 'COURT_STAY';

export interface CitizenNode {
  citizenHash: string;
  panHash: string;
  name: string;
  dateOfBirth: string;
  aadhaarState: string;
  citizenType: CitizenType;
  totalDeclaredAssets: number;
  totalIncome5Yr: number;
  prevYearAssets: number;
  assets5YrAgo: number;
  anomalyScore: number;
  lastUpdated: string;
  createdAt: string;
}

export interface PropertyRecord {
  propertyId: string;
  ownerHash: string;
  prevOwnerHash?: string;
  registrationNo: string;
  propertyType: PropertyType;
  declaredValue: number;
  circleRateValue: number;
  areaSqft: number;
  district: string;
  state: string;
  registrationDate: string;
  transferType: string;
  stampDutyPaid: number;
  encumbrance: Encumbrance;
  mortgageAmount?: number;
  isActive: boolean;
  createdAt: string;
  lastUpdated: string;
}

export interface AnomalyFlag {
  flagId: string;
  citizenHash: string;
  ruleTriggered: string;
  severity: Severity;
  description: string;
  assetValueUsed: number;
  incomeValueUsed: number;
  gapAmount: number;
  status: FlagStatus;
  raisedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface AccessLog {
  logId: string;
  citizenHash: string;
  accessorHash: string;
  accessorRole: AccessorRole;
  accessType: string;
  dataTypes: string[];
  purpose: string;
  authorizationRef?: string;
  timestamp: string;
  txId: string;
}

export interface ZKPProof {
  proofId: string;
  citizenHash: string;
  queryType: string;
  isVerified: boolean;
  verifiedAt?: string;
  expiresAt: string;
  submittedAt: string;
  submittedBy: string;
}

export interface JWTPayload {
  sub: string;
  role: AccessorRole;
  name: string;
  iat?: number;
  exp?: number;
}

export interface TransferRecord {
  transferId: string;
  propertyId: string;
  fromOwnerHash: string;
  toOwnerHash: string;
  transferValue: number;
  transferType: string;
  transferDate: string;
  reason: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  txId?: string;
}
