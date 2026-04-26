import * as fabric from '../fabric/contracts';
import { db } from '../db/client';
import { isFabricUnavailable } from '../utils/fabricErrors';
import type { PermissionRule } from '../fabric/contracts';

export type { PermissionRule };

function rowToRule(r: Record<string, unknown>): PermissionRule {
  return {
    accessorRole:             r.accessor_role              as string,
    allowedDataTypes:         r.data_types                 as string[],
    requiresAuthorizationRef: r.requires_ref               as boolean,
  };
}

export async function getAllPermissions(): Promise<PermissionRule[]> {
  try {
    const rules = await fabric.getAllPermissionRules();
    if (rules.length > 0) return rules;
    // Fabric returned empty (InitLedger not yet called on this deployment) — seed from PostgreSQL
    console.warn('[permissions] Fabric returned empty permission set — serving from PostgreSQL mirror');
  } catch (err) {
    if (!isFabricUnavailable(err)) throw err;
    console.warn('[permissions] Fabric peer unavailable — serving from PostgreSQL mirror');
  }
  const result = await db.query('SELECT * FROM permission_rules ORDER BY accessor_role');
  return result.rows.map(rowToRule);
}

export async function updatePermission(
  role: string, dataTypes: string[], requiresRef: boolean
): Promise<PermissionRule> {
  const rule = await fabric.updatePermissionRule(role, dataTypes, requiresRef);

  // Mirror to PostgreSQL
  db.query(
    `INSERT INTO permission_rules (accessor_role, data_types, requires_ref, last_updated)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (accessor_role) DO UPDATE
       SET data_types = $2, requires_ref = $3, last_updated = NOW()`,
    [role, dataTypes, requiresRef]
  ).catch(err => console.warn('[sync:updatePermission] mirror update failed:', (err as Error).message));

  return rule;
}
