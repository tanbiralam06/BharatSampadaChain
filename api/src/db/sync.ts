import { db } from './client';
import type { CitizenNode, PropertyRecord, AnomalyFlag, AccessLog } from '../models';

// All functions in this module are best-effort: they log errors but never throw.
// Fabric is the source of truth — a mirror write failure must not fail the request.

function warn(fn: string, err: unknown) {
  console.warn(`[sync:${fn}] PostgreSQL mirror write failed:`, (err as Error).message ?? err);
}

export async function syncCitizen(c: CitizenNode): Promise<void> {
  try {
    await db.query(
      `INSERT INTO citizens
         (citizen_hash, pan_hash, name, date_of_birth, aadhaar_state,
          citizen_type, total_declared_assets, total_income_5yr,
          anomaly_score, last_updated, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (citizen_hash) DO UPDATE SET
         pan_hash              = EXCLUDED.pan_hash,
         name                  = EXCLUDED.name,
         date_of_birth         = EXCLUDED.date_of_birth,
         aadhaar_state         = EXCLUDED.aadhaar_state,
         citizen_type          = EXCLUDED.citizen_type,
         total_declared_assets = EXCLUDED.total_declared_assets,
         total_income_5yr      = EXCLUDED.total_income_5yr,
         anomaly_score         = EXCLUDED.anomaly_score,
         last_updated          = EXCLUDED.last_updated`,
      [
        c.citizenHash, c.panHash, c.name,
        c.dateOfBirth || null, c.aadhaarState, c.citizenType,
        c.totalDeclaredAssets, c.totalIncome5Yr,
        c.anomalyScore, c.lastUpdated, c.createdAt,
      ]
    );
  } catch (err) {
    warn('syncCitizen', err);
  }
}

export async function syncProperty(p: PropertyRecord): Promise<void> {
  try {
    await db.query(
      `INSERT INTO properties
         (property_id, owner_hash, prev_owner_hash, registration_no,
          property_type, declared_value, circle_rate_value, area_sqft,
          district, state, registration_date, transfer_type,
          encumbrance, mortgage_amount, is_active, created_at, last_updated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (property_id) DO UPDATE SET
         owner_hash        = EXCLUDED.owner_hash,
         prev_owner_hash   = EXCLUDED.prev_owner_hash,
         declared_value    = EXCLUDED.declared_value,
         transfer_type     = EXCLUDED.transfer_type,
         encumbrance       = EXCLUDED.encumbrance,
         mortgage_amount   = EXCLUDED.mortgage_amount,
         is_active         = EXCLUDED.is_active,
         last_updated      = EXCLUDED.last_updated`,
      [
        p.propertyId, p.ownerHash, p.prevOwnerHash ?? null,
        p.registrationNo, p.propertyType,
        p.declaredValue, p.circleRateValue, p.areaSqft,
        p.district, p.state, p.registrationDate, p.transferType,
        p.encumbrance, p.mortgageAmount ?? 0, p.isActive,
        p.createdAt, p.lastUpdated,
      ]
    );
  } catch (err) {
    warn('syncProperty', err);
  }
}

export async function syncFlag(f: AnomalyFlag): Promise<void> {
  try {
    await db.query(
      `INSERT INTO anomaly_flags
         (flag_id, citizen_hash, rule_triggered, severity, description,
          asset_value_used, income_value_used, gap_amount,
          status, raised_at, resolved_at, resolution_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (flag_id) DO UPDATE SET
         status           = EXCLUDED.status,
         resolved_at      = EXCLUDED.resolved_at,
         resolution_notes = EXCLUDED.resolution_notes`,
      [
        f.flagId, f.citizenHash, f.ruleTriggered, f.severity,
        f.description, f.assetValueUsed, f.incomeValueUsed, f.gapAmount,
        f.status, f.raisedAt, f.resolvedAt ?? null, f.resolutionNotes ?? null,
      ]
    );
  } catch (err) {
    warn('syncFlag', err);
  }
}

export async function syncFlags(flags: AnomalyFlag[]): Promise<void> {
  await Promise.all(flags.map(syncFlag));
}

export async function syncAccessLog(l: AccessLog): Promise<void> {
  try {
    await db.query(
      `INSERT INTO access_logs
         (log_id, citizen_hash, accessor_hash, accessor_role,
          access_type, data_types, purpose, authorization_ref,
          accessed_at, blockchain_tx_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (log_id) DO NOTHING`,
      [
        l.logId, l.citizenHash, l.accessorHash, l.accessorRole,
        l.accessType, l.dataTypes, l.purpose,
        l.authorizationRef ?? null, l.timestamp, l.txId,
      ]
    );
  } catch (err) {
    warn('syncAccessLog', err);
  }
}

// Records a notification in system_audit when an officer accesses citizen data.
export async function notifyOfficerAccess(params: {
  actorHash: string;
  citizenHash: string;
  role: string;
  accessType: string;
  dataTypes: string[];
  purpose: string;
}): Promise<void> {
  try {
    await db.query(
      `INSERT INTO system_audit (actor_hash, action, target, details)
       VALUES ($1, 'OFFICER_ACCESS', $2, $3)`,
      [
        params.actorHash,
        params.citizenHash,
        JSON.stringify({
          role: params.role,
          accessType: params.accessType,
          dataTypes: params.dataTypes,
          purpose: params.purpose,
        }),
      ]
    );
  } catch (err) {
    warn('notifyOfficerAccess', err);
  }
}
