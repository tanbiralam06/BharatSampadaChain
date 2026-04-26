import * as fabric from '../fabric/contracts';
import { db } from '../db/client';
import { syncFlag, syncFlags } from '../db/sync';
import { isFabricUnavailable } from '../utils/fabricErrors';
import type { AnomalyFlag } from '../models';

// Maps a PostgreSQL anomaly_flags row (snake_case) to the canonical AnomalyFlag type.
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
    raisedAt:        (r.raised_at as Date).toISOString(),
    resolvedAt:      r.resolved_at  ? (r.resolved_at  as Date).toISOString() : undefined,
    resolutionNotes: r.resolution_notes as string | undefined,
  };
}


async function flagsFromPostgres(severity?: string): Promise<AnomalyFlag[]> {
  const result = severity
    ? await db.query('SELECT * FROM anomaly_flags WHERE severity = $1 ORDER BY raised_at DESC', [severity])
    : await db.query('SELECT * FROM anomaly_flags ORDER BY raised_at DESC');
  return result.rows.map(rowToFlag);
}

export async function getAllFlags(): Promise<AnomalyFlag[]> {
  try {
    const [red, orange, yellow] = await Promise.all([
      fabric.getFlagsBySeverity('RED'),
      fabric.getFlagsBySeverity('ORANGE'),
      fabric.getFlagsBySeverity('YELLOW'),
    ]);
    return [...red, ...orange, ...yellow];
  } catch (err) {
    if (isFabricUnavailable(err)) {
      console.warn('[flags] Fabric peer unavailable — serving from PostgreSQL mirror');
      return flagsFromPostgres();
    }
    throw err;
  }
}

export async function getFlagsBySeverity(severity: string): Promise<AnomalyFlag[]> {
  try {
    return await fabric.getFlagsBySeverity(severity.toUpperCase());
  } catch (err) {
    if (isFabricUnavailable(err)) {
      console.warn('[flags] Fabric peer unavailable — serving from PostgreSQL mirror');
      return flagsFromPostgres(severity.toUpperCase());
    }
    throw err;
  }
}

export async function updateFlagStatus(flagId: string, status: string, notes: string): Promise<void> {
  await fabric.updateFlagStatus(flagId, status, notes);

  // The chaincode returns void — sync only the changed columns directly
  const resolvedAt = (status === 'CLEARED' || status === 'ESCALATED') ? new Date().toISOString() : null;
  db.query(
    `UPDATE anomaly_flags
     SET status = $1, resolution_notes = $2, resolved_at = $3
     WHERE flag_id = $4`,
    [status, notes || null, resolvedAt, flagId]
  ).catch(err => console.warn('[sync:updateFlagStatus] mirror update failed:', (err as Error).message));
}

export async function submitManualFlag(params: {
  citizenHash: string; ruleTriggered: string; severity: string;
  description: string; assetValue: number; incomeValue: number; gapAmount: number;
}): Promise<AnomalyFlag> {
  const flag = await fabric.submitManualFlag(params);
  void syncFlag(flag);
  return flag;
}

export async function syncAllFlags(): Promise<void> {
  const [red, orange, yellow] = await Promise.all([
    fabric.getFlagsBySeverity('RED'),
    fabric.getFlagsBySeverity('ORANGE'),
    fabric.getFlagsBySeverity('YELLOW'),
  ]);
  await syncFlags([...red, ...orange, ...yellow]);
}
