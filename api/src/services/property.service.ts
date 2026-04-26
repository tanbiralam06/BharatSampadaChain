import * as fabric from '../fabric/contracts';
import { db } from '../db/client';
import { syncProperty } from '../db/sync';
import { isFabricUnavailable } from '../utils/fabricErrors';
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
  try {
    return await fabric.getProperty(propertyId);
  } catch (err) {
    if (!isFabricUnavailable(err)) throw err;
    console.warn('[properties] Fabric peer unavailable — serving from PostgreSQL mirror');
    const result = await db.query('SELECT * FROM properties WHERE property_id = $1', [propertyId]);
    const r = result.rows[0];
    if (!r) throw Object.assign(new Error('Property not found'), { status: 404 });
    return {
      propertyId:       r.property_id,
      ownerHash:        r.owner_hash,
      prevOwnerHash:    r.prev_owner_hash ?? undefined,
      registrationNo:   r.registration_no,
      propertyType:     r.property_type,
      declaredValue:    Number(r.declared_value),
      circleRateValue:  Number(r.circle_rate_value),
      areaSqft:         Number(r.area_sqft),
      district:         r.district,
      state:            r.state,
      registrationDate: r.registration_date,
      transferType:     r.transfer_type,
      stampDutyPaid:    Number(r.stamp_duty_paid ?? 0),
      encumbrance:      r.encumbrance,
      mortgageAmount:   r.mortgage_amount ? Number(r.mortgage_amount) : undefined,
      isActive:         r.is_active,
      createdAt:        r.created_at.toISOString(),
      lastUpdated:      r.last_updated.toISOString(),
    };
  }
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
