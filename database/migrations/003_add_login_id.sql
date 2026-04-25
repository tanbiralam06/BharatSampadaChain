-- Add human-readable login_id to bsc_users.
-- Previously users logged in with their raw subject_hash (64-char hex) which is
-- impractical for real users. login_id decouples the login credential from the
-- blockchain identity key:
--   citizens  → 12-digit Aadhaar number
--   officers  → government email address
--   admin     → short username
--
-- subject_hash stays the primary key and the JWT sub claim — nothing else changes.

ALTER TABLE bsc_users ADD COLUMN IF NOT EXISTS login_id VARCHAR(100) UNIQUE;

-- System users
UPDATE bsc_users SET login_id = 'admin'                       WHERE role = 'ADMIN';
UPDATE bsc_users SET login_id = 'rajesh.kumar@itdept.bsc.gov' WHERE role = 'IT_DEPT';
UPDATE bsc_users SET login_id = 'priya.sharma@cbi.gov.in'     WHERE role = 'CBI';

-- Seed citizens (Aadhaar numbers — fake, dev only)
UPDATE bsc_users SET login_id = '123456789012' WHERE role = 'CITIZEN' AND name = 'Arjun Mehta';
UPDATE bsc_users SET login_id = '234567890123' WHERE role = 'CITIZEN' AND name = 'Sunita Rao';
UPDATE bsc_users SET login_id = '345678901234' WHERE role = 'CITIZEN' AND name = 'Priya Krishnan';

-- Make login_id NOT NULL now that all rows are populated
ALTER TABLE bsc_users ALTER COLUMN login_id SET NOT NULL;
