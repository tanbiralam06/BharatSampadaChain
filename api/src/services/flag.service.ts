import * as fabric from '../fabric/contracts';
import { db } from '../db/client';
import { syncFlag, syncFlags } from '../db/sync';
import type { AnomalyFlag } from '../models';

export async function getAllFlags(): Promise<AnomalyFlag[]> {
  const [red, orange, yellow] = await Promise.all([
    fabric.getFlagsBySeverity('RED'),
    fabric.getFlagsBySeverity('ORANGE'),
    fabric.getFlagsBySeverity('YELLOW'),
  ]);
  return [...red, ...orange, ...yellow];
}

export async function getFlagsBySeverity(severity: string): Promise<AnomalyFlag[]> {
  return fabric.getFlagsBySeverity(severity.toUpperCase());
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
