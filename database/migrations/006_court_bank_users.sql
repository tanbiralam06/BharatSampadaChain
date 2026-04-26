-- Seed COURT and BANK officer accounts for Phase 3 development
-- Password for all seed users: "password" (bcrypt hash — dev only, change in production)

INSERT INTO bsc_users (subject_hash, login_id, name, role, password_hash) VALUES
('court01hashabcdef0123456789abcdef0123456789abcdef0123456789abcde', 'judge.sharma@hc.gov.in',      'Justice Meera Sharma (HC)',    'COURT', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('bank001hashabcdef0123456789abcdef0123456789abcdef0123456789abcde',  'compliance@sbi.co.in',        'SBI Compliance Officer',       'BANK',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (login_id) DO NOTHING;
