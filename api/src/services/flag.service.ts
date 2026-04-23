import * as fabric from '../fabric/contracts';
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
  return fabric.updateFlagStatus(flagId, status, notes);
}

export async function submitManualFlag(params: {
  citizenHash: string; ruleTriggered: string; severity: string;
  description: string; assetValue: number; incomeValue: number; gapAmount: number;
}): Promise<AnomalyFlag> {
  return fabric.submitManualFlag(params);
}
