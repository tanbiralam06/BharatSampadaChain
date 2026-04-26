import * as fabric from '../fabric/contracts';
import { db } from '../db/client';
import { syncFlag } from '../db/sync';
import type { AnomalyFlag } from '../models';

export interface BenamiRule {
  ruleCode: string;
  description: string;
  severity: AnomalyFlag['severity'];
  triggered: boolean;
  assetValue: number;
  incomeValue: number;
  gapAmount: number;
}

export interface BenamiScanResult {
  citizenHash: string;
  rulesEvaluated: number;
  flagsRaised: number;
  flags: AnomalyFlag[];
  ruleDetails: BenamiRule[];
}

// ── Rule evaluation ───────────────────────────────────────────────────────────

function evalProxyOwnership(propertyCount: number, transferredCount: number): BenamiRule {
  const triggered = propertyCount >= 2 && transferredCount >= 3;
  return {
    ruleCode:    'PROXY_OWNERSHIP_PATTERN',
    description: `Citizen holds ${propertyCount} properties, ${transferredCount} were received via transfer — proxy/benami ownership pattern`,
    severity:    'ORANGE',
    triggered,
    assetValue:  transferredCount,
    incomeValue: 0,
    gapAmount:   transferredCount,
  };
}

function evalSystematicUndervaluation(
  totalProps: number,
  undervaluedProps: number,
  totalDeclaredValue: number,
  totalCircleValue: number
): BenamiRule {
  const pct = totalProps > 0 ? undervaluedProps / totalProps : 0;
  const triggered = totalProps >= 2 && pct >= 0.5;
  const gap = totalCircleValue - totalDeclaredValue;
  return {
    ruleCode:    'SYSTEMATIC_UNDERVALUATION',
    description: `${undervaluedProps} of ${totalProps} properties (${Math.round(pct * 100)}%) declared below 90% of circle rate — systematic benami undervaluation`,
    severity:    'RED',
    triggered,
    assetValue:  totalDeclaredValue,
    incomeValue: totalCircleValue,
    gapAmount:   gap > 0 ? gap : 0,
  };
}

function evalDisproportionateWealth(totalAssets: number, totalIncome5Yr: number): BenamiRule {
  const annualIncome = totalIncome5Yr / 5;
  const threshold    = annualIncome * 15;
  const triggered    = annualIncome > 0 && totalAssets > threshold;
  const gap          = triggered ? totalAssets - threshold : 0;
  return {
    ruleCode:    'DISPROPORTIONATE_ASSETS',
    description: `Declared assets exceed 15× annual income — wealth far exceeds explainable accumulation`,
    severity:    'ORANGE',
    triggered,
    assetValue:  totalAssets,
    incomeValue: Math.round(annualIncome),
    gapAmount:   Math.round(gap),
  };
}

function evalUnexplainedSurge(totalAssets: number, assets5YrAgo: number, totalIncome5Yr: number): BenamiRule {
  const growth       = totalAssets - assets5YrAgo;
  const maxExplained = totalIncome5Yr * 3;
  const triggered    = assets5YrAgo > 0 && totalIncome5Yr > 0 && growth > maxExplained;
  const gap          = triggered ? growth - maxExplained : 0;
  return {
    ruleCode:    'UNEXPLAINED_5YR_SURGE',
    description: `5-year asset growth exceeds 3× total declared income — unexplained wealth accumulation`,
    severity:    'RED',
    triggered,
    assetValue:  totalAssets,
    incomeValue: totalIncome5Yr,
    gapAmount:   Math.round(gap),
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function runBenamiScan(
  citizenHash: string,
  submittedBy: string
): Promise<BenamiScanResult> {
  // Fetch citizen profile from PostgreSQL mirror
  const citizenResult = await db.query(
    'SELECT total_declared_assets, total_income_5yr, assets_5yr_ago FROM citizens WHERE citizen_hash = $1',
    [citizenHash]
  );
  if (!citizenResult.rows[0]) {
    throw Object.assign(new Error('Citizen not found'), { status: 404 });
  }
  const { total_declared_assets, total_income_5yr, assets_5yr_ago } = citizenResult.rows[0];
  const totalAssets  = Number(total_declared_assets);
  const totalIncome  = Number(total_income_5yr);
  const assets5YrAgo = Number(assets_5yr_ago ?? 0);

  // Fetch property stats from PostgreSQL mirror
  const propResult = await db.query(
    `SELECT
       COUNT(*)                                                                    AS total_count,
       COUNT(*) FILTER (WHERE prev_owner_hash IS NOT NULL)                         AS transferred_count,
       COUNT(*) FILTER (WHERE declared_value < circle_rate_value * 0.9)           AS undervalued_count,
       COALESCE(SUM(declared_value),    0)                                         AS total_declared_value,
       COALESCE(SUM(circle_rate_value), 0)                                         AS total_circle_value
     FROM properties
     WHERE owner_hash = $1 AND is_active = true`,
    [citizenHash]
  );
  const p = propResult.rows[0];
  const totalProps        = Number(p.total_count);
  const transferredCount  = Number(p.transferred_count);
  const undervaluedCount  = Number(p.undervalued_count);
  const totalDeclaredVal  = Number(p.total_declared_value);
  const totalCircleVal    = Number(p.total_circle_value);

  // Evaluate all 4 rules
  const rules: BenamiRule[] = [
    evalProxyOwnership(totalProps, transferredCount),
    evalSystematicUndervaluation(totalProps, undervaluedCount, totalDeclaredVal, totalCircleVal),
    evalDisproportionateWealth(totalAssets, totalIncome),
    evalUnexplainedSurge(totalAssets, assets5YrAgo, totalIncome),
  ];

  // Submit flags for triggered rules
  const flags: AnomalyFlag[] = [];
  for (const rule of rules) {
    if (!rule.triggered) continue;
    const flag = await fabric.submitManualFlag({
      citizenHash,
      ruleTriggered: rule.ruleCode,
      severity:      rule.severity,
      description:   rule.description,
      assetValue:    rule.assetValue,
      incomeValue:   rule.incomeValue,
      gapAmount:     rule.gapAmount,
    });
    void syncFlag(flag);
    flags.push(flag);
  }

  return {
    citizenHash,
    rulesEvaluated: rules.length,
    flagsRaised:    flags.length,
    flags,
    ruleDetails:    rules,
  };
}
