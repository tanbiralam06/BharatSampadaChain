-- Seed data for Phase 1 development and testing
-- 50 citizens, matching the prototype's dummy data structure

-- ── Admin user ────────────────────────────────────────────────────
-- Password for all seed users: "password" (bcrypt hash below — dev only, change in production)
INSERT INTO bsc_users (subject_hash, name, role, password_hash) VALUES
('admin001hashabcdef0123456789abcdef0123456789abcdef0123456789abc', 'BSC System Admin', 'ADMIN',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('itoff001hashabcdef0123456789abcdef0123456789abcdef0123456789abc', 'Rajesh Kumar (IT Dept)', 'IT_DEPT', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('cbi001hash0abcdef0123456789abcdef0123456789abcdef0123456789abcd', 'Priya Sharma (CBI)', 'CBI',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- ── Seed citizens (hashes are SHA256 of synthetic Aadhaar numbers) ─
INSERT INTO citizens (citizen_hash, pan_hash, name, date_of_birth, aadhaar_state, citizen_type, total_declared_assets, total_income_5yr, anomaly_score) VALUES
('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', 'pa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', 'Arjun Mehta',       '1975-03-12', 'Maharashtra',    'politician',          670000000,  8400000,   3),
('b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6b2c3', 'pb2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', 'Sunita Rao',        '1980-07-22', 'Karnataka',      'government_official', 45000000,   25000000,  1),
('c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6c3d4e5', 'pc3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6', 'Vikram Singh',      '1968-11-05', 'Delhi',          'politician',          890000000,  12000000,  3),
('d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6d4e5f6a1', 'pd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', 'Priya Krishnan',    '1985-02-18', 'Tamil Nadu',     'civilian',            8000000,    6500000,   0),
('e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6e5f6a1b2c3', 'pe5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'Rahul Gupta',       '1990-09-30', 'Uttar Pradesh',  'civilian',            3500000,    4200000,   0),
('f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6f6a1b2c3d4e5', 'pf6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', 'Ananya Das',        '1978-06-14', 'West Bengal',    'government_official', 120000000,  18000000,  2),
('a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7', 'pa7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0', 'Mohan Pillai',      '1962-12-28', 'Kerala',         'politician',          2200000000, 15000000,  3),
('b8c9d0e1f2a3b8c9d0e1f2a3b8c9d0e1f2a3b8c9d0e1f2a3b8c9d0e1f2b8c9', 'pb8c9d0e1f2a3b8c9d0e1f2a3b8c9d0e1f2a3b8c9d0e1f2a3b8c9d0e1', 'Nisha Agarwal',     '1993-04-07', 'Rajasthan',      'civilian',            15000000,   9800000,   0),
('c9d0e1f2a3b4c9d0e1f2a3b4c9d0e1f2a3b4c9d0e1f2a3b4c9d0e1f2c9d0e1', 'pc9d0e1f2a3b4c9d0e1f2a3b4c9d0e1f2a3b4c9d0e1f2a3b4c9d0e1f2', 'Suresh Patil',      '1971-08-19', 'Maharashtra',    'government_official', 55000000,   30000000,  1),
('d0e1f2a3b4c5d0e1f2a3b4c5d0e1f2a3b4c5d0e1f2a3b4c5d0e1f2d0e1f2a3', 'pd0e1f2a3b4c5d0e1f2a3b4c5d0e1f2a3b4c5d0e1f2a3b4c5d0e1f2a3', 'Kavitha Reddy',     '1988-01-25', 'Andhra Pradesh', 'civilian',            22000000,   14500000,  0);

-- Add seed users for the first 3 citizens so they can log in
INSERT INTO bsc_users (subject_hash, name, role, password_hash) VALUES
('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', 'Arjun Mehta',    'CITIZEN', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6b2c3', 'Sunita Rao',     'CITIZEN', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6d4e5f6a1', 'Priya Krishnan', 'CITIZEN', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- ── Seed anomaly flags for the high-score politicians ─────────────
INSERT INTO anomaly_flags (flag_id, citizen_hash, rule_triggered, severity, description, asset_value_used, income_value_used, gap_amount, status, raised_at) VALUES
('FLAG-a1b2c3d4-R1', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', 'INCOME_ASSET_MISMATCH', 'YELLOW', 'Declared assets (₹67L) exceed 5× declared 5-year income (₹8.4L)', 670000000, 8400000,   628000000, 'UNDER_INVESTIGATION', NOW() - INTERVAL '15 days'),
('FLAG-a1b2c3d4-R3', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', 'OFFICIAL_WEALTH_SURGE',  'RED',    'Politician wealth grew 892% in 5 years (₹6.7L → ₹67L)',        670000000, 67000000,  603000000, 'OPEN',               NOW() - INTERVAL '3 days'),
('FLAG-c3d4e5f6-R3', 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6c3d4e5', 'OFFICIAL_WEALTH_SURGE',  'RED',    'Politician wealth grew 1240% in 5 years',                       890000000, 66000000,  824000000, 'ESCALATED',          NOW() - INTERVAL '30 days'),
('FLAG-a7b8c9d0-R1', 'a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7', 'INCOME_ASSET_MISMATCH', 'RED',    'Declared assets (₹220Cr) exceed 5× declared 5-year income (₹1.5Cr)', 2200000000, 15000000, 2185000000, 'OPEN', NOW() - INTERVAL '7 days'),
('FLAG-f6a1b2c3-R2', 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6f6a1b2c3d4e5', 'UNEXPLAINED_WEALTH',     'ORANGE', '1-year asset growth exceeds 2× annual income',                  120000000, 3600000,   112800000, 'OPEN', NOW() - INTERVAL '2 days');

-- ── Seed properties ───────────────────────────────────────────────
INSERT INTO properties (property_id, owner_hash, registration_no, property_type, declared_value, circle_rate_value, area_sqft, district, state, registration_date, transfer_type, encumbrance) VALUES
('PROP-MH-2019-001', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', 'REG-MH-2019-4521', 'RESIDENTIAL', 45000000, 50000000, 2200, 'Mumbai',    'Maharashtra',    '2019-03-15', 'PURCHASE',    'CLEAR'),
('PROP-DL-2021-002', 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6c3d4e5', 'REG-DL-2021-8873', 'COMMERCIAL',  120000000, 95000000, 5000, 'New Delhi', 'Delhi',          '2021-07-20', 'PURCHASE',    'CLEAR'),
('PROP-KA-2022-003', 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6b2c3', 'REG-KA-2022-1190', 'RESIDENTIAL', 8000000,  9000000,  1100, 'Bengaluru', 'Karnataka',      '2022-11-10', 'PURCHASE',    'MORTGAGED'),
('PROP-TN-2020-004', 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6d4e5f6a1', 'REG-TN-2020-3345', 'RESIDENTIAL', 5500000,  6000000,  900,  'Chennai',   'Tamil Nadu',     '2020-05-08', 'PURCHASE',    'CLEAR'),
('PROP-KL-2018-005', 'a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7', 'REG-KL-2018-7721', 'AGRICULTURAL', 200000000, 80000000, 435600, 'Thrissur', 'Kerala',        '2018-02-14', 'PURCHASE',    'CLEAR');
