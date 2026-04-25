import * as fabric from '../fabric/contracts';
import { syncProperty } from '../db/sync';
import type { PropertyRecord, TransferRecord } from '../models';

export async function registerProperty(params: {
  propertyId: string; ownerHash: string; registrationNo: string;
  propertyType: string; declaredValue: number; circleRateValue: number;
  areaSqft: number; district: string; state: string;
  registrationDate: string; transferType: string; stampDutyPaid: number;
}): Promise<PropertyRecord> {
  const property = await fabric.registerProperty(params);
  void syncProperty(property);
  return property;
}

export async function getProperty(propertyId: string): Promise<PropertyRecord> {
  return fabric.getProperty(propertyId);
}

export async function transferProperty(params: {
  propertyId: string; newOwnerHash: string;
  transferType: string; reason: string; transferValue: number;
}): Promise<TransferRecord> {
  const transfer = await fabric.transferProperty(params);

  // Read the updated property state back from the ledger and sync it
  const updated = await fabric.getProperty(params.propertyId).catch(() => null);
  if (updated) void syncProperty(updated);

  return transfer;
}
