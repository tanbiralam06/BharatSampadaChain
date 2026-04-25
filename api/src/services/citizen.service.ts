import * as fabric from '../fabric/contracts';
import { getCache, setCache, invalidateCache } from '../cache/redis';
import { syncCitizen, syncFlags, syncAccessLog, notifyOfficerAccess } from '../db/sync';
import type { CitizenNode, AnomalyFlag, AccessLog, PropertyRecord, JWTPayload } from '../models';

export async function getCitizen(citizenHash: string, accessor: JWTPayload): Promise<CitizenNode> {
  const cached = await getCache<CitizenNode>(`citizen:${citizenHash}`);
  if (cached) return cached;

  const citizen = await fabric.getCitizenNode(citizenHash);

  const accessLog = await fabric.logAccess({
    citizenHash,
    accessorHash: accessor.sub,
    accessorRole: accessor.role,
    accessType: 'VIEW',
    dataTypes: ['INCOME_SUMMARY', 'ASSET_SUMMARY'],
    purpose: 'Profile view',
  });

  // Mirror to PostgreSQL — fire-and-forget
  void syncAccessLog(accessLog);
  if (accessor.role !== 'CITIZEN') {
    void notifyOfficerAccess({
      actorHash: accessor.sub,
      citizenHash,
      role: accessor.role,
      accessType: 'VIEW',
      dataTypes: ['INCOME_SUMMARY', 'ASSET_SUMMARY'],
      purpose: 'Profile view',
    });
  }

  await setCache(`citizen:${citizenHash}`, citizen, 60);
  return citizen;
}

export async function createCitizen(params: {
  citizenHash: string; panHash: string; name: string; dateOfBirth: string;
  aadhaarState: string; citizenType: string;
  totalDeclaredAssets: number; totalIncome5Yr: number;
  prevYearAssets: number; assets5YrAgo: number;
}): Promise<CitizenNode> {
  const citizen = await fabric.createCitizenNode({
    citizenHash: params.citizenHash,
    panHash: params.panHash,
    name: params.name,
    dob: params.dateOfBirth,
    state: params.aadhaarState,
    citizenType: params.citizenType,
    totalAssets: params.totalDeclaredAssets,
    totalIncome5Yr: params.totalIncome5Yr,
    prevYearAssets: params.prevYearAssets,
    assets5YrAgo: params.assets5YrAgo,
  });

  void syncCitizen(citizen);
  return citizen;
}

export async function runAnomalyCheck(citizenHash: string): Promise<{ flagsRaised: number; flags: AnomalyFlag[] }> {
  const flags = await fabric.runAnomalyCheck(citizenHash);

  // Sync flags and update citizen anomaly score in mirror
  void syncFlags(flags);
  if (flags.length > 0) {
    const citizen = await fabric.getCitizenNode(citizenHash).catch(() => null);
    if (citizen) void syncCitizen(citizen);
  }

  return { flagsRaised: flags.length, flags };
}

export async function getCitizenFlags(citizenHash: string): Promise<AnomalyFlag[]> {
  return fabric.getFlagsByCitizen(citizenHash);
}

export async function getCitizenAccessLog(citizenHash: string): Promise<AccessLog[]> {
  return fabric.getAccessLogsByCitizen(citizenHash);
}

export async function getCitizenProperties(citizenHash: string, accessor: JWTPayload): Promise<PropertyRecord[]> {
  const properties = await fabric.getPropertiesByOwner(citizenHash);

  const accessLog = await fabric.logAccess({
    citizenHash,
    accessorHash: accessor.sub,
    accessorRole: accessor.role,
    accessType: 'VIEW',
    dataTypes: ['PROPERTY_LIST'],
    purpose: 'Property list view',
  });

  void syncAccessLog(accessLog);
  if (accessor.role !== 'CITIZEN') {
    void notifyOfficerAccess({
      actorHash: accessor.sub,
      citizenHash,
      role: accessor.role,
      accessType: 'VIEW',
      dataTypes: ['PROPERTY_LIST'],
      purpose: 'Property list view',
    });
  }

  return properties;
}

export async function updateCitizenAssets(params: {
  citizenHash: string; totalAssets: number; totalIncome5Yr: number;
  prevYearAssets: number; assets5YrAgo: number;
}): Promise<void> {
  await fabric.updateCitizenAssets(params);

  // Refresh mirror with updated state from ledger
  const citizen = await fabric.getCitizenNode(params.citizenHash).catch(() => null);
  if (citizen) {
    void syncCitizen(citizen);
    void invalidateCache(`citizen:${params.citizenHash}`);
  }
}
