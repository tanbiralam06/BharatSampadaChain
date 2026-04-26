import * as fabric from '../fabric/contracts';
import { getCache, setCache, invalidateCache } from '../cache/redis';
import { db } from '../db/client';
import { syncCitizen, syncFlags, syncAccessLog, notifyOfficerAccess } from '../db/sync';
import { isFabricUnavailable } from '../utils/fabricErrors';
import type { CitizenNode, AnomalyFlag, AccessLog, PropertyRecord, JWTPayload } from '../models';

// ── PostgreSQL fallback helpers ───────────────────────────────────────────────

function rowToCitizen(r: Record<string, unknown>): CitizenNode {
  return {
    citizenHash:          r.citizen_hash           as string,
    panHash:              r.pan_hash               as string,
    name:                 r.name                   as string,
    dateOfBirth:          r.date_of_birth          as string,
    aadhaarState:         r.aadhaar_state          as string,
    citizenType:          r.citizen_type           as CitizenNode['citizenType'],
    totalDeclaredAssets:  Number(r.total_declared_assets),
    totalIncome5Yr:       Number(r.total_income_5yr),
    prevYearAssets:       Number(r.prev_year_assets  ?? 0),
    assets5YrAgo:         Number(r.assets_5yr_ago    ?? 0),
    anomalyScore:         Number(r.anomaly_score),
    lastUpdated:          r.last_updated ? (r.last_updated as Date).toISOString() : new Date().toISOString(),
    createdAt:            r.created_at   ? (r.created_at   as Date).toISOString() : new Date().toISOString(),
  };
}

function rowToFlag(r: Record<string, unknown>): AnomalyFlag {
  return {
    flagId:          r.flag_id          as string,
    citizenHash:     r.citizen_hash     as string,
    ruleTriggered:   r.rule_triggered   as string,
    severity:        r.severity         as AnomalyFlag['severity'],
    description:     r.description      as string,
    assetValueUsed:  Number(r.asset_value_used),
    incomeValueUsed: Number(r.income_value_used),
    gapAmount:       Number(r.gap_amount),
    status:          r.status           as AnomalyFlag['status'],
    raisedAt:        (r.raised_at  as Date).toISOString(),
    resolvedAt:      r.resolved_at  ? (r.resolved_at  as Date).toISOString() : undefined,
    resolutionNotes: r.resolution_notes as string | undefined,
  };
}

function rowToProperty(r: Record<string, unknown>): PropertyRecord {
  return {
    propertyId:       r.property_id        as string,
    ownerHash:        r.owner_hash         as string,
    prevOwnerHash:    r.prev_owner_hash    as string | undefined,
    registrationNo:   r.registration_no   as string,
    propertyType:     r.property_type      as PropertyRecord['propertyType'],
    declaredValue:    Number(r.declared_value),
    circleRateValue:  Number(r.circle_rate_value),
    areaSqft:         Number(r.area_sqft),
    district:         r.district           as string,
    state:            r.state              as string,
    registrationDate: r.registration_date  as string,
    transferType:     r.transfer_type      as string,
    stampDutyPaid:    Number(r.stamp_duty_paid ?? 0),
    encumbrance:      r.encumbrance        as PropertyRecord['encumbrance'],
    mortgageAmount:   r.mortgage_amount    ? Number(r.mortgage_amount) : undefined,
    isActive:         r.is_active          as boolean,
    createdAt:        (r.created_at  as Date).toISOString(),
    lastUpdated:      (r.last_updated as Date).toISOString(),
  };
}

function rowToAccessLog(r: Record<string, unknown>): AccessLog {
  return {
    logId:            r.log_id            as string,
    citizenHash:      r.citizen_hash      as string,
    accessorHash:     r.accessor_hash     as string,
    accessorRole:     r.accessor_role     as AccessLog['accessorRole'],
    accessType:       r.access_type       as string,
    dataTypes:        r.data_types        as string[],
    purpose:          r.purpose           as string,
    authorizationRef: r.authorization_ref as string | undefined,
    timestamp:        (r.accessed_at as Date).toISOString(),
    txId:             (r.blockchain_tx_hash ?? '') as string,
  };
}

// ── Service methods ───────────────────────────────────────────────────────────

export async function getCitizen(citizenHash: string, accessor: JWTPayload): Promise<CitizenNode> {
  const cached = await getCache<CitizenNode>(`citizen:${citizenHash}`);
  if (cached) return cached;

  let citizen: CitizenNode;
  try {
    citizen = await fabric.getCitizenNode(citizenHash);

    const accessLog = await fabric.logAccess({
      citizenHash,
      accessorHash: accessor.sub,
      accessorRole: accessor.role,
      accessType: 'VIEW',
      dataTypes: ['INCOME_SUMMARY', 'ASSET_SUMMARY'],
      purpose: 'Profile view',
    });
    void syncAccessLog(accessLog);
  } catch (err) {
    if (!isFabricUnavailable(err)) throw err;
    console.warn('[citizens] Fabric peer unavailable — serving from PostgreSQL mirror');
    const result = await db.query('SELECT * FROM citizens WHERE citizen_hash = $1', [citizenHash]);
    if (!result.rows[0]) throw Object.assign(new Error('Citizen not found'), { status: 404 });
    citizen = rowToCitizen(result.rows[0]);
  }

  if (accessor.role !== 'CITIZEN') {
    void notifyOfficerAccess({
      actorHash: accessor.sub, citizenHash, role: accessor.role,
      accessType: 'VIEW', dataTypes: ['INCOME_SUMMARY', 'ASSET_SUMMARY'], purpose: 'Profile view',
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
  void syncFlags(flags);
  if (flags.length > 0) {
    const citizen = await fabric.getCitizenNode(citizenHash).catch(() => null);
    if (citizen) void syncCitizen(citizen);
  }
  return { flagsRaised: flags.length, flags };
}

export async function getCitizenFlags(citizenHash: string): Promise<AnomalyFlag[]> {
  try {
    return await fabric.getFlagsByCitizen(citizenHash);
  } catch (err) {
    if (!isFabricUnavailable(err)) throw err;
    console.warn('[citizens] Fabric peer unavailable — serving flags from PostgreSQL mirror');
    const result = await db.query(
      'SELECT * FROM anomaly_flags WHERE citizen_hash = $1 ORDER BY raised_at DESC',
      [citizenHash]
    );
    return result.rows.map(rowToFlag);
  }
}

export async function getCitizenAccessLog(citizenHash: string): Promise<AccessLog[]> {
  try {
    return await fabric.getAccessLogsByCitizen(citizenHash);
  } catch (err) {
    if (!isFabricUnavailable(err)) throw err;
    console.warn('[citizens] Fabric peer unavailable — serving access logs from PostgreSQL mirror');
    const result = await db.query(
      'SELECT * FROM access_logs WHERE citizen_hash = $1 ORDER BY accessed_at DESC',
      [citizenHash]
    );
    return result.rows.map(rowToAccessLog);
  }
}

export async function getCitizenProperties(citizenHash: string, accessor: JWTPayload): Promise<PropertyRecord[]> {
  let properties: PropertyRecord[];
  try {
    properties = await fabric.getPropertiesByOwner(citizenHash);

    const accessLog = await fabric.logAccess({
      citizenHash,
      accessorHash: accessor.sub,
      accessorRole: accessor.role,
      accessType: 'VIEW',
      dataTypes: ['PROPERTY_LIST'],
      purpose: 'Property list view',
    });
    void syncAccessLog(accessLog);
  } catch (err) {
    if (!isFabricUnavailable(err)) throw err;
    console.warn('[citizens] Fabric peer unavailable — serving properties from PostgreSQL mirror');
    const result = await db.query(
      'SELECT * FROM properties WHERE owner_hash = $1 ORDER BY created_at DESC',
      [citizenHash]
    );
    properties = result.rows.map(rowToProperty);
  }

  if (accessor.role !== 'CITIZEN') {
    void notifyOfficerAccess({
      actorHash: accessor.sub, citizenHash, role: accessor.role,
      accessType: 'VIEW', dataTypes: ['PROPERTY_LIST'], purpose: 'Property list view',
    });
  }

  return properties;
}

export async function updateCitizenAssets(params: {
  citizenHash: string; totalAssets: number; totalIncome5Yr: number;
  prevYearAssets: number; assets5YrAgo: number;
}): Promise<void> {
  await fabric.updateCitizenAssets(params);
  const citizen = await fabric.getCitizenNode(params.citizenHash).catch(() => null);
  if (citizen) {
    void syncCitizen(citizen);
    void invalidateCache(`citizen:${params.citizenHash}`);
  }
}
