-- Phase 3: TOTP (Time-based OTP) columns for ADMIN 2FA
-- totp_secret: base32 secret stored only when admin initiates setup
-- totp_enabled: becomes true only after admin verifies a code during setup

ALTER TABLE bsc_users ADD COLUMN IF NOT EXISTS totp_secret  VARCHAR(64);
ALTER TABLE bsc_users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false;
