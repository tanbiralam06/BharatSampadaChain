import * as fabric from '../fabric/contracts';
import type { PropertyRecord } from '../models';

export async function registerProperty(params: {
  propertyId: string; ownerHash: string; registrationNo: string;
  propertyType: string; declaredValue: number; circleRateValue: number;
  areaSqft: number; district: string; state: string;
  registrationDate: string; transferType: string; stampDutyPaid: number;
}): Promise<PropertyRecord> {
  return fabric.registerProperty(params);
}

export async function getProperty(propertyId: string): Promise<PropertyRecord> {
  return fabric.getProperty(propertyId);
}

export async function transferProperty(params: {
  propertyId: string; newOwnerHash: string;
  transferType: string; reason: string; transferValue: number;
}): Promise<void> {
  return fabric.transferProperty(params);
}
