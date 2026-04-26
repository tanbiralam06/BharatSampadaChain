// Canonical types shared across all four BSC frontend apps.
// Mirror of api/src/models/index.ts — keep in sync when API types change.

export type CitizenType = 'civilian' | 'government_official' | 'politician';
export type Severity    = 'YELLOW' | 'ORANGE' | 'RED';
export type FlagStatus  = 'OPEN' | 'UNDER_INVESTIGATION' | 'CLEARED' | 'ESCALATED';
export type AccessorRole = 'CITIZEN' | 'IT_DEPT' | 'ED' | 'CBI' | 'COURT' | 'BANK' | 'ADMIN' | 'PUBLIC';
export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'AGRICULTURAL' | 'INDUSTRIAL' | 'PLOT';
export type Encumbrance  = 'CLEAR' | 'MORTGAGED' | 'DISPUTED' | 'COURT_STAY';
export type AssetType    = 'BANK_ACCOUNT' | 'MUTUAL_FUND' | 'EPF' | 'FD' | 'STOCKS' | 'NPS' | 'FOREIGN_ASSET' | 'OTHER';
export type BalanceRange = 'UNDER_1L' | '1L_10L' | '10L_1CR' | '1CR_10CR' | 'ABOVE_10CR';
export type VerificationStatus = 'SELF_DECLARED' | 'AGENCY_VERIFIED' | 'PENDING';

// ── Citizen ──────────────────────────────────────────────────────────────────

export interface CitizenNode {
  citizenHash: string;
  panHash: string;
  name: string;
  dateOfBirth: string;
  aadhaarState: string;
  citizenType: CitizenType;
  totalDeclaredAssets: number;  // paisa
  totalIncome5Yr: number;       // paisa
  prevYearAssets: number;       // paisa
  assets5YrAgo: number;         // paisa
  anomalyScore: number;         // 0–3
  lastUpdated: string;
  createdAt: string;
}

// Public-safe subset returned by GET /citizens (list) — no PAN hash or exact DOB
export interface CitizenSummary {
  citizen_hash: string;
  name: string;
  citizen_type: CitizenType;
  aadhaar_state: string;
  total_declared_assets: number; // paisa
  total_income_5yr: number;      // paisa
  anomaly_score: number;
  created_at: string;
}

// ── Property ─────────────────────────────────────────────────────────────────

export interface PropertyRecord {
  propertyId: string;
  ownerHash: string;
  prevOwnerHash?: string;
  registrationNo: string;
  propertyType: PropertyType;
  declaredValue: number;    // paisa
  circleRateValue: number;  // paisa
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

// ── Anomaly Flag ─────────────────────────────────────────────────────────────

export interface AnomalyFlag {
  flagId: string;
  citizenHash: string;
  ruleTriggered: string;
  severity: Severity;
  description: string;
  assetValueUsed: number;  // paisa
  incomeValueUsed: number; // paisa
  gapAmount: number;       // paisa
  status: FlagStatus;
  raisedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

// ── Access Log ────────────────────────────────────────────────────────────────

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

// ── Financial Asset ───────────────────────────────────────────────────────────

export interface FinancialAsset {
  asset_id: string;
  owner_hash: string;
  asset_type: AssetType;
  institution_name: string | null;
  balance_range: BalanceRange | null;
  approximate_value: number;  // paisa
  as_of_date: string | null;
  source_agency: string | null;
  verification_status: VerificationStatus;
  is_joint_account: boolean;
  joint_owner_hash: string | null;
  created_at: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  sub: string;
  role: AccessorRole;
  name: string;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  token: string;
  name: string;
  role: AccessorRole;
}

// ── Officer User ──────────────────────────────────────────────────────────────

export type OfficerRole = 'IT_DEPT' | 'ED' | 'CBI' | 'COURT' | 'BANK';

export interface OfficerUser {
  subject_hash: string;
  login_id:     string;
  name:         string;
  role:         OfficerRole;
  is_active:    boolean;
  created_at:   string;
  last_login:   string | null;
}

export interface CreateOfficerInput {
  name:     string;
  login_id: string;
  role:     OfficerRole;
  password: string;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface HealthData {
  status: 'healthy' | 'degraded';
  services: {
    postgres: 'up' | 'down';
    redis: 'up' | 'down';
    fabric: 'connected' | 'disconnected';
  };
  timestamp: string;
}

export interface StatsData {
  totalCitizens: number;
  totalProperties: number;
  openFlags: number;
  redFlags: number;
}

// ── API envelope ──────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  txId?: string;
}
