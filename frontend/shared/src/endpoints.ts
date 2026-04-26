// One typed function per API route.
// All callers import from here — no raw URL strings in any app.

import { apiClient } from './apiClient';
import type {
  ApiResponse, CitizenNode, CitizenSummary, PropertyRecord,
  AnomalyFlag, AccessLog, FinancialAsset, LoginResponse,
  HealthData, StatsData, AccessorRole, Severity, FlagStatus, CitizenType,
  OfficerUser, CreateOfficerInput, TotpSetupData, TotpChallengeResponse,
} from './types';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const login = (identifier: string, password: string, role: AccessorRole) =>
  apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { identifier, password, role })
    .then((r) => r.data.data!);

// Admin login — may return a full token or a TOTP challenge depending on enrollment
export const adminLogin = (identifier: string, password: string) =>
  apiClient.post<ApiResponse<LoginResponse | TotpChallengeResponse>>('/auth/login', { identifier, password, role: 'ADMIN' })
    .then((r) => r.data.data!);

export const totpSetup = () =>
  apiClient.post<ApiResponse<TotpSetupData>>('/auth/totp/setup')
    .then((r) => r.data.data!);

export const totpVerifySetup = (code: string) =>
  apiClient.post<ApiResponse<{ enabled: boolean }>>('/auth/totp/verify-setup', { code })
    .then((r) => r.data.data!);

export const totpVerify = (challenge_token: string, code: string) =>
  apiClient.post<ApiResponse<LoginResponse>>('/auth/totp/verify', { challenge_token, code })
    .then((r) => r.data.data!);

export const totpDisable = (code: string) =>
  apiClient.post<ApiResponse<{ disabled: boolean }>>('/auth/totp/disable', { code })
    .then((r) => r.data.data!);

export const totpStatus = () =>
  apiClient.get<ApiResponse<{ enabled: boolean }>>('/auth/totp/status')
    .then((r) => r.data.data!);

export const refreshToken = () =>
  apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh')
    .then((r) => r.data.data!.token);

export const guestLogin = () =>
  apiClient.post<ApiResponse<LoginResponse>>('/auth/guest')
    .then((r) => r.data.data!);

// ── Citizens ──────────────────────────────────────────────────────────────────

export const getCitizen = (hash: string) =>
  apiClient.get<ApiResponse<CitizenNode>>(`/citizens/${hash}`)
    .then((r) => r.data.data!);

export const listCitizens = (params?: {
  type?: CitizenType;
  state?: string;
  search?: string;
  limit?: number;
}) =>
  apiClient.get<ApiResponse<CitizenSummary[]>>('/citizens', { params })
    .then((r) => r.data.data!);

export const getCitizenFlags = (hash: string) =>
  apiClient.get<ApiResponse<AnomalyFlag[]>>(`/citizens/${hash}/flags`)
    .then((r) => r.data.data!);

export const getCitizenAccessLog = (hash: string) =>
  apiClient.get<ApiResponse<AccessLog[]>>(`/citizens/${hash}/access-log`)
    .then((r) => r.data.data!);

export const getCitizenProperties = (hash: string) =>
  apiClient.get<ApiResponse<PropertyRecord[]>>(`/citizens/${hash}/properties`)
    .then((r) => r.data.data!);

export const getCitizenFinancialAssets = (hash: string) =>
  apiClient.get<ApiResponse<FinancialAsset[]>>(`/citizens/${hash}/financial-assets`)
    .then((r) => r.data.data!);

export const triggerAnomalyCheck = (hash: string) =>
  apiClient.post<ApiResponse<{ flagsRaised: number; flags: AnomalyFlag[] }>>(
    `/citizens/${hash}/check-anomaly`
  ).then((r) => r.data.data!);

// ── Flags ─────────────────────────────────────────────────────────────────────

export const getAllFlags = (severity?: Severity) =>
  apiClient.get<ApiResponse<AnomalyFlag[]>>('/flags', { params: severity ? { severity } : undefined })
    .then((r) => r.data.data!);

export const updateFlagStatus = (id: string, status: FlagStatus, resolutionNotes?: string) =>
  apiClient.put<ApiResponse<{ message: string }>>(`/flags/${id}`, { status, resolutionNotes })
    .then((r) => r.data.data!);

export const submitManualFlag = (payload: {
  citizenHash: string;
  ruleTriggered: 'BENAMI_SUSPICION' | 'SHELL_COMPANY_LINK' | 'FOREIGN_ASSET_UNDECLARED' | 'LIFESTYLE_MISMATCH';
  severity: Severity;
  description: string;
  assetValue: number;
  incomeValue: number;
  gapAmount: number;
}) =>
  apiClient.post<ApiResponse<AnomalyFlag>>('/flags/manual', payload)
    .then((r) => r.data.data!);

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getHealth = () =>
  apiClient.get<ApiResponse<HealthData>>('/admin/health')
    .then((r) => r.data.data!);

export const getStats = () =>
  apiClient.get<ApiResponse<StatsData>>('/admin/stats')
    .then((r) => r.data.data!);

export const listOfficers = () =>
  apiClient.get<ApiResponse<OfficerUser[]>>('/admin/officers')
    .then((r) => r.data.data!);

export const createOfficer = (payload: CreateOfficerInput) =>
  apiClient.post<ApiResponse<OfficerUser>>('/admin/officers', payload)
    .then((r) => r.data.data!);

export const setOfficerStatus = (hash: string, is_active: boolean) =>
  apiClient.put<ApiResponse<OfficerUser>>(`/admin/officers/${hash}/status`, { is_active })
    .then((r) => r.data.data!);
