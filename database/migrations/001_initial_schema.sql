-- BSC off-chain index database
-- Run order: this file is mounted to postgres docker-entrypoint-initdb.d/
-- Applied automatically on first container start.

-- ── Users (for API authentication) ──────────────────────────────
CREATE TABLE IF NOT EXISTS bsc_users (
    subject_hash    VARCHAR(64) PRIMARY KEY,  -- citizenHash or officerID hash
    name            VARCHAR(200) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('CITIZEN','IT_DEPT','ED','CBI','COURT','BANK','ADMIN','PUBLIC')),
    password_hash   VARCHAR(60) NOT NULL,     -- bcrypt
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login      TIMESTAMPTZ
);

-- ── Citizens (off-chain metadata mirror) ─────────────────────────
CREATE TABLE IF NOT EXISTS citizens (
    citizen_hash         VARCHAR(64) PRIMARY KEY,
    pan_hash             VARCHAR(64) NOT NULL UNIQUE,
    name                 VARCHAR(200) NOT NULL,
    date_of_birth        DATE,
    aadhaar_state        VARCHAR(50),
    citizen_type         VARCHAR(30) NOT NULL DEFAULT 'civilian',
    total_declared_assets BIGINT NOT NULL DEFAULT 0,  -- in paisa
    total_income_5yr     BIGINT NOT NULL DEFAULT 0,
    anomaly_score        INTEGER NOT NULL DEFAULT 0,
    kyc_level            INTEGER NOT NULL DEFAULT 1,
    is_active            BOOLEAN NOT NULL DEFAULT true,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_citizens_type ON citizens (citizen_type);
CREATE INDEX idx_citizens_anomaly_score ON citizens (anomaly_score DESC);

-- ── Properties ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
    property_id         VARCHAR(100) PRIMARY KEY,
    owner_hash          VARCHAR(64) NOT NULL REFERENCES citizens (citizen_hash),
    prev_owner_hash     VARCHAR(64),
    registration_no     VARCHAR(100) NOT NULL,
    property_type       VARCHAR(30) NOT NULL,
    declared_value      BIGINT NOT NULL,  -- in paisa
    circle_rate_value   BIGINT NOT NULL DEFAULT 0,
    area_sqft           BIGINT,
    district            VARCHAR(100),
    state               VARCHAR(100),
    registration_date   DATE,
    transfer_type       VARCHAR(30),
    encumbrance         VARCHAR(20) NOT NULL DEFAULT 'CLEAR',
    mortgage_amount     BIGINT DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    blockchain_tx_hash  VARCHAR(128),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_owner ON properties (owner_hash);
CREATE INDEX idx_properties_state ON properties (state);
CREATE INDEX idx_properties_type ON properties (property_type);

-- ── Anomaly flags ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anomaly_flags (
    flag_id             VARCHAR(100) PRIMARY KEY,
    citizen_hash        VARCHAR(64) NOT NULL REFERENCES citizens (citizen_hash),
    rule_triggered      VARCHAR(50) NOT NULL,
    severity            VARCHAR(10) NOT NULL CHECK (severity IN ('YELLOW','ORANGE','RED')),
    description         TEXT,
    asset_value_used    BIGINT DEFAULT 0,
    income_value_used   BIGINT DEFAULT 0,
    gap_amount          BIGINT DEFAULT 0,
    status              VARCHAR(25) NOT NULL DEFAULT 'OPEN'
                        CHECK (status IN ('OPEN','UNDER_INVESTIGATION','CLEARED','ESCALATED')),
    raised_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ,
    resolution_notes    TEXT,
    blockchain_tx_hash  VARCHAR(128)
);

CREATE INDEX idx_flags_citizen ON anomaly_flags (citizen_hash);
CREATE INDEX idx_flags_severity ON anomaly_flags (severity);
CREATE INDEX idx_flags_status ON anomaly_flags (status);
CREATE INDEX idx_flags_raised_at ON anomaly_flags (raised_at DESC);

-- ── Access logs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_logs (
    log_id              VARCHAR(100) PRIMARY KEY,
    citizen_hash        VARCHAR(64) NOT NULL,
    accessor_hash       VARCHAR(64) NOT NULL,
    accessor_role       VARCHAR(20) NOT NULL,
    access_type         VARCHAR(30) NOT NULL,
    data_types          TEXT[],
    purpose             TEXT,
    authorization_ref   VARCHAR(200),
    accessed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blockchain_tx_hash  VARCHAR(128)
);

CREATE INDEX idx_access_citizen ON access_logs (citizen_hash);
CREATE INDEX idx_access_accessor ON access_logs (accessor_hash);
CREATE INDEX idx_access_at ON access_logs (accessed_at DESC);

-- ── Financial assets ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_assets (
    asset_id            VARCHAR(100) PRIMARY KEY,
    owner_hash          VARCHAR(64) NOT NULL REFERENCES citizens (citizen_hash),
    asset_type          VARCHAR(30) NOT NULL,
    institution_name    VARCHAR(200),
    balance_range       VARCHAR(30),        -- UNDER_1L | 1L_10L | 10L_1CR | 1CR_10CR | ABOVE_10CR
    approximate_value   BIGINT DEFAULT 0,   -- midpoint of range for anomaly calcs
    as_of_date          DATE,
    source_agency       VARCHAR(50),
    verification_status VARCHAR(20) DEFAULT 'SELF_DECLARED',
    is_joint_account    BOOLEAN DEFAULT false,
    joint_owner_hash    VARCHAR(64),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_owner ON financial_assets (owner_hash);

-- ── System audit (admin operations log) ──────────────────────────
CREATE TABLE IF NOT EXISTS system_audit (
    audit_id        SERIAL PRIMARY KEY,
    actor_hash      VARCHAR(64) NOT NULL,
    action          VARCHAR(100) NOT NULL,
    target          VARCHAR(200),
    details         JSONB,
    performed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
