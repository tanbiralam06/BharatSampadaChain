-- Migration 007: add dispute columns to anomaly_flags
-- Citizens can dispute a flag; dispute is stored in PostgreSQL only
-- (the on-chain flag record is immutable — officers still resolve via PUT /flags/:id)

ALTER TABLE anomaly_flags
  ADD COLUMN IF NOT EXISTS dispute_reason  TEXT,
  ADD COLUMN IF NOT EXISTS disputed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_status  VARCHAR(20);

COMMENT ON COLUMN anomaly_flags.dispute_reason  IS 'Citizen-submitted explanation for why the flag is incorrect';
COMMENT ON COLUMN anomaly_flags.disputed_at     IS 'When the citizen submitted the dispute';
COMMENT ON COLUMN anomaly_flags.dispute_status  IS 'PENDING = awaiting officer review, REVIEWED = officer has seen it';
