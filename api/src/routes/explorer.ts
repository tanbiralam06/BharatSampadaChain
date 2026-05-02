import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { db } from '../db/client';

const router = Router();

// GET /explorer/stats — chain-wide counts (ADMIN only)
router.get('/stats', authenticate, requireRole('ADMIN'), asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [citizens, properties, flagsAll, openFlags, accessLogs, last24h] = await Promise.all([
    db.query<{ count: string }>('SELECT COUNT(*)::text FROM citizens'),
    db.query<{ count: string }>('SELECT COUNT(*)::text FROM properties'),
    db.query<{ count: string }>('SELECT COUNT(*)::text FROM anomaly_flags'),
    db.query<{ count: string }>("SELECT COUNT(*)::text FROM anomaly_flags WHERE status = 'OPEN'"),
    db.query<{ count: string }>('SELECT COUNT(*)::text FROM access_logs'),
    db.query<{ count: string }>(
      "SELECT COUNT(*)::text FROM ( " +
      "  SELECT created_at AS ts FROM citizens WHERE created_at > NOW() - INTERVAL '24 hours' " +
      "  UNION ALL " +
      "  SELECT created_at AS ts FROM properties WHERE created_at > NOW() - INTERVAL '24 hours' " +
      "  UNION ALL " +
      "  SELECT raised_at AS ts FROM anomaly_flags WHERE raised_at > NOW() - INTERVAL '24 hours' " +
      "  UNION ALL " +
      "  SELECT accessed_at AS ts FROM access_logs WHERE accessed_at > NOW() - INTERVAL '24 hours' " +
      ") sub"
    ),
  ]);

  res.json({
    success: true,
    data: {
      totalCitizens:   Number(citizens.rows[0].count),
      totalProperties: Number(properties.rows[0].count),
      totalFlags:      Number(flagsAll.rows[0].count),
      openFlags:       Number(openFlags.rows[0].count),
      totalAccessLogs: Number(accessLogs.rows[0].count),
      last24hEvents:   Number(last24h.rows[0].count),
    },
  });
}));

// GET /explorer/activity — recent 60 ledger events across all chaincodes (ADMIN only)
router.get('/activity', authenticate, requireRole('ADMIN'), asyncHandler(async (_req: AuthRequest, res: Response) => {
  // Combine recent events from three tables into a unified timeline
  const result = await db.query<{
    id: string; event_type: string; chaincode: string;
    description: string; subject_hash: string; actor_hash: string;
    ts: Date; tx_id: string | null;
  }>(
    `SELECT id, event_type, chaincode, description, subject_hash, actor_hash, ts, tx_id FROM (
      SELECT
        flag_id::text              AS id,
        'FLAG_RAISED'              AS event_type,
        'anomaly'                  AS chaincode,
        rule_triggered || ' — ' || severity AS description,
        citizen_hash               AS subject_hash,
        citizen_hash               AS actor_hash,
        raised_at                  AS ts,
        NULL::text                 AS tx_id
      FROM anomaly_flags

      UNION ALL

      SELECT
        property_id::text          AS id,
        'PROPERTY_REGISTERED'      AS event_type,
        'property'                 AS chaincode,
        property_type || ' in ' || district || ', ' || state AS description,
        owner_hash                 AS subject_hash,
        owner_hash                 AS actor_hash,
        created_at                 AS ts,
        NULL::text                 AS tx_id
      FROM properties

      UNION ALL

      SELECT
        citizen_hash::text         AS id,
        'CITIZEN_CREATED'          AS event_type,
        'anomaly'                  AS chaincode,
        'Citizen node created'     AS description,
        citizen_hash               AS subject_hash,
        citizen_hash               AS actor_hash,
        created_at                 AS ts,
        NULL::text                 AS tx_id
      FROM citizens

      UNION ALL

      SELECT
        log_id::text               AS id,
        'ACCESS_LOG'               AS event_type,
        'access'                   AS chaincode,
        accessor_role || ' accessed citizen data' AS description,
        citizen_hash               AS subject_hash,
        accessor_hash              AS actor_hash,
        accessed_at                AS ts,
        blockchain_tx_hash         AS tx_id
      FROM access_logs

    ) combined
    ORDER BY ts DESC
    LIMIT 60`
  );

  const events = result.rows.map((r) => ({
    id:          r.id,
    eventType:   r.event_type,
    chaincode:   r.chaincode,
    description: r.description,
    subjectHash: r.subject_hash,
    actorHash:   r.actor_hash,
    timestamp:   r.ts.toISOString(),
    txId:        r.tx_id ?? undefined,
  }));

  res.json({ success: true, data: events });
}));

export default router;
