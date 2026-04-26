import { getContract } from './connection';
import { config } from '../config';
import type { AnomalyFlag, CitizenNode, AccessLog, PropertyRecord, TransferRecord, ZKPProof } from '../models';

function decode(bytes: Uint8Array): unknown {
  if (!bytes || bytes.length === 0) return null;
  return JSON.parse(Buffer.from(bytes).toString());
}

// ── Anomaly chaincode ─────────────────────────────────────────────

export async function createCitizenNode(params: {
  citizenHash: string; panHash: string; name: string; dob: string;
  state: string; citizenType: string;
  totalAssets: number; totalIncome5Yr: number;
  prevYearAssets: number; assets5YrAgo: number;
}): Promise<CitizenNode> {
  const cc = await getContract(config.fabric.chaincodes.anomaly);
  const result = await cc.submitTransaction(
    'CreateCitizenNode',
    params.citizenHash, params.panHash, params.name, params.dob,
    params.state, params.citizenType,
    String(params.totalAssets), String(params.totalIncome5Yr),
    String(params.prevYearAssets), String(params.assets5YrAgo)
  );
  return decode(result) as CitizenNode;
}

export async function getCitizenNode(citizenHash: string): Promise<CitizenNode> {
  const cc = await getContract(config.fabric.chaincodes.anomaly);
  const result = await cc.evaluateTransaction('GetCitizenNode', citizenHash);
  return decode(result) as CitizenNode;
}

export async function updateCitizenAssets(params: {
  citizenHash: string; totalAssets: number; totalIncome5Yr: number;
  prevYearAssets: number; assets5YrAgo: number;
}): Promise<void> {
  const cc = await getContract(config.fabric.chaincodes.anomaly);
  await cc.submitTransaction(
    'UpdateCitizenAssets',
    params.citizenHash,
    String(params.totalAssets), String(params.totalIncome5Yr),
    String(params.prevYearAssets), String(params.assets5YrAgo)
  );
}

export async function runAnomalyCheck(citizenHash: string): Promise<AnomalyFlag[]> {
  const cc = await getContract(config.fabric.chaincodes.anomaly);
  const result = await cc.submitTransaction('RunAnomalyCheck', citizenHash);
  return (decode(result) as AnomalyFlag[]) ?? [];
}

export async function getFlagsByCitizen(citizenHash: string): Promise<AnomalyFlag[]> {
  const cc = await getContract(config.fabric.chaincodes.anomaly);
  const result = await cc.evaluateTransaction('GetFlagsByCitizen', citizenHash);
  return (decode(result) as AnomalyFlag[]) ?? [];
}

export async function getFlagsBySeverity(severity: string): Promise<AnomalyFlag[]> {
  const cc = await getContract(config.fabric.chaincodes.anomaly);
  const result = await cc.evaluateTransaction('GetFlagsBySeverity', severity);
  return (decode(result) as AnomalyFlag[]) ?? [];
}

export async function updateFlagStatus(flagId: string, status: string, notes: string): Promise<void> {
  const cc = await getContract(config.fabric.chaincodes.anomaly);
  await cc.submitTransaction('UpdateFlagStatus', flagId, status, notes);
}

export async function submitManualFlag(params: {
  citizenHash: string; ruleTriggered: string; severity: string;
  description: string; assetValue: number; incomeValue: number; gapAmount: number;
}): Promise<AnomalyFlag> {
  const cc = await getContract(config.fabric.chaincodes.anomaly);
  const result = await cc.submitTransaction(
    'SubmitManualFlag',
    params.citizenHash, params.ruleTriggered, params.severity,
    params.description,
    String(params.assetValue), String(params.incomeValue), String(params.gapAmount)
  );
  return decode(result) as AnomalyFlag;
}

// ── Property chaincode ────────────────────────────────────────────

export async function registerProperty(params: {
  propertyId: string; ownerHash: string; registrationNo: string;
  propertyType: string; declaredValue: number; circleRateValue: number;
  areaSqft: number; district: string; state: string;
  registrationDate: string; transferType: string; stampDutyPaid: number;
}): Promise<PropertyRecord> {
  const cc = await getContract(config.fabric.chaincodes.property);
  const result = await cc.submitTransaction(
    'RegisterProperty',
    params.propertyId, params.ownerHash, params.registrationNo, params.propertyType,
    String(params.declaredValue), String(params.circleRateValue), String(params.areaSqft),
    params.district, params.state, params.registrationDate,
    params.transferType, String(params.stampDutyPaid)
  );
  return decode(result) as PropertyRecord;
}

export async function getProperty(propertyId: string): Promise<PropertyRecord> {
  const cc = await getContract(config.fabric.chaincodes.property);
  const result = await cc.evaluateTransaction('GetProperty', propertyId);
  return decode(result) as PropertyRecord;
}

export async function getPropertiesByOwner(ownerHash: string): Promise<PropertyRecord[]> {
  const cc = await getContract(config.fabric.chaincodes.property);
  const result = await cc.evaluateTransaction('GetPropertiesByOwner', ownerHash);
  return (decode(result) as PropertyRecord[]) ?? [];
}

export async function transferProperty(params: {
  propertyId: string; newOwnerHash: string;
  transferType: string; reason: string; transferValue: number;
}): Promise<TransferRecord> {
  const cc = await getContract(config.fabric.chaincodes.property);
  const result = await cc.submitTransaction(
    'TransferProperty',
    params.propertyId, params.newOwnerHash,
    params.transferType, params.reason, String(params.transferValue)
  );
  return decode(result) as TransferRecord;
}

// ── Access chaincode ──────────────────────────────────────────────

export async function logAccess(params: {
  citizenHash: string; accessorHash: string; accessorRole: string;
  accessType: string; dataTypes: string[]; purpose: string;
  authorizationRef?: string;
}): Promise<AccessLog> {
  const cc = await getContract(config.fabric.chaincodes.access);
  const result = await cc.submitTransaction(
    'LogAccess',
    params.citizenHash, params.accessorHash, params.accessorRole,
    params.accessType, JSON.stringify(params.dataTypes),
    params.purpose
  );
  return decode(result) as AccessLog;
}

export async function checkPermission(
  accessorRole: string, dataType: string, authorizationRef = ''
): Promise<boolean> {
  const cc = await getContract(config.fabric.chaincodes.access);
  const result = await cc.evaluateTransaction('CheckPermission', accessorRole, dataType, authorizationRef);
  return decode(result) as boolean;
}

export async function getAccessLogsByCitizen(citizenHash: string): Promise<AccessLog[]> {
  const cc = await getContract(config.fabric.chaincodes.access);
  const result = await cc.evaluateTransaction('GetAccessLogsByCitizen', citizenHash);
  return (decode(result) as AccessLog[]) ?? [];
}

export interface PermissionRule {
  accessorRole: string;
  allowedDataTypes: string[];
  requiresAuthorizationRef: boolean;
}

export async function getAllPermissionRules(): Promise<PermissionRule[]> {
  const cc = await getContract(config.fabric.chaincodes.access);
  const result = await cc.evaluateTransaction('GetAllPermissionRules');
  return (decode(result) as PermissionRule[]) ?? [];
}

export async function getPermissionRule(role: string): Promise<PermissionRule> {
  const cc = await getContract(config.fabric.chaincodes.access);
  const result = await cc.evaluateTransaction('GetPermissionRule', role);
  return decode(result) as PermissionRule;
}

export async function updatePermissionRule(
  role: string, dataTypes: string[], requiresRef: boolean
): Promise<PermissionRule> {
  const cc = await getContract(config.fabric.chaincodes.access);
  const result = await cc.submitTransaction(
    'UpdatePermissionRule',
    role, JSON.stringify(dataTypes), String(requiresRef)
  );
  return decode(result) as PermissionRule;
}

// ── ZKP chaincode ─────────────────────────────────────────────────

export async function submitZKPProof(params: {
  citizenHash: string; queryType: string;
  proof: string; publicInputs: string; submittedBy: string;
}): Promise<ZKPProof> {
  const cc = await getContract(config.fabric.chaincodes.zkp);
  const result = await cc.submitTransaction(
    'SubmitProof',
    params.citizenHash, params.queryType,
    params.proof, params.publicInputs, params.submittedBy
  );
  return decode(result) as ZKPProof;
}

export async function getVerifiedClaims(citizenHash: string): Promise<unknown[]> {
  const cc = await getContract(config.fabric.chaincodes.zkp);
  const result = await cc.evaluateTransaction('GetVerifiedClaims', citizenHash);
  return (decode(result) as unknown[]) ?? [];
}
