-- Mirror of the on-chain permission matrix (PERM_<role> keys in the access chaincode).
-- Serves as PostgreSQL fallback when Fabric peer is offline.
CREATE TABLE IF NOT EXISTS permission_rules (
  accessor_role   VARCHAR(20) PRIMARY KEY,
  data_types      TEXT[]      NOT NULL,
  requires_ref    BOOLEAN     NOT NULL DEFAULT false,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO permission_rules (accessor_role, data_types, requires_ref) VALUES
  ('CITIZEN', ARRAY['ALL'],                                                                      false),
  ('IT_DEPT', ARRAY['INCOME_SUMMARY','ASSET_SUMMARY','ANOMALY_STATUS'],                          true),
  ('ED',      ARRAY['INCOME_SUMMARY','ASSET_SUMMARY','PROPERTY_LIST','BUSINESS_HOLDINGS'],       true),
  ('CBI',     ARRAY['ALL'],                                                                      true),
  ('COURT',   ARRAY['ALL'],                                                                      true),
  ('BANK',    ARRAY['CREDIT_SCORE'],                                                             true),
  ('ADMIN',   ARRAY['SYSTEM_METADATA'],                                                          false),
  ('PUBLIC',  ARRAY['OFFICIAL_WEALTH_SUMMARY'],                                                  false)
ON CONFLICT (accessor_role) DO NOTHING;
