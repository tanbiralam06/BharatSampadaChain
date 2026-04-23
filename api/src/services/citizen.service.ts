import * as fabric from '../fabric/contracts';
import { getCache, setCache } from '../cache/redis';
import type { CitizenNode, AnomalyFlag, AccessLog, PropertyRecord, JWTPayload } from '../models';

export async function getCitizen(citizenHash: string, accessor: JWTPayload): Promise<CitizenNode> {
  const cached = await getCache<CitizenNode>(`citizen:${citizenHash}`);
  if (cached) return cached;

  const citizen = await fabric.getCitizenNode(citizenHash);

  await fabric.logAccess({
    citizenHash,
    accessorHash: accessor.sub,
    accessorRole: accessor.role,
    accessType: 'VIEW',
    dataTypes: ['INCOME_SUMMARY', 'ASSET_SUMMARY'],
    purpose: 'Profile view',
  });

  await setCache(`citizen:${citizenHash}`, citizen, 60);
  return citizen;
}

export async function createCitizen(params: {
  citizenHash: string; panHash: string; name: string; dateOfBirth: string;
  aadhaarState: string; citizenType: string;
  totalDeclaredAssets: number; totalIncome5Yr: number;
  prevYearAssets: number; assets5YrAgo: number;
}): Promise<CitizenNode> {
  return fabric.createCitizenNode({
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
}

export async function runAnomalyCheck(citizenHash: string): Promise<{ flagsRaised: number; flags: AnomalyFlag[] }> {
  const flags = await fabric.runAnomalyCheck(citizenHash);
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

  await fabric.logAccess({
    citizenHash,
    accessorHash: accessor.sub,
    accessorRole: accessor.role,
    accessType: 'VIEW',
    dataTypes: ['PROPERTY_LIST'],
    purpose: 'Property list view',
  });

  return properties;
}
