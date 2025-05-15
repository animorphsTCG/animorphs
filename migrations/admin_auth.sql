
-- Migration for admin authentication tables
CREATE TABLE IF NOT EXISTS admin_totp_secrets (
  user_id TEXT PRIMARY KEY,
  totp_secret TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS admin_backup_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  backup_code TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME,
  is_used BOOLEAN DEFAULT false,
  FOREIGN KEY (user_id) REFERENCES admin_totp_secrets(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_webauthn_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  device_name TEXT,
  FOREIGN KEY (user_id) REFERENCES admin_totp_secrets(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cloudflare_pending_scripts (
  id TEXT PRIMARY KEY,
  script TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  executed_at DATETIME,
  created_by TEXT,
  result TEXT
);
