
-- Cloudflare D1 Schema for Animorphs TCG
-- This replaces the Supabase schema with D1-compatible equivalents

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  name TEXT,
  surname TEXT,
  email TEXT,
  age INTEGER,
  gender TEXT,
  country TEXT,
  mp INTEGER NOT NULL DEFAULT 0,
  ai_points INTEGER NOT NULL DEFAULT 0,
  lbp INTEGER NOT NULL DEFAULT 0,
  digi INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 0,
  music_unlocked BOOLEAN NOT NULL DEFAULT 0,
  bio TEXT,
  favorite_animorph TEXT,
  favorite_battle_mode TEXT,
  online_times_gmt2 TEXT,
  playing_times TEXT,
  profile_image_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Payment status table
CREATE TABLE IF NOT EXISTS payment_status (
  id TEXT PRIMARY KEY REFERENCES profiles(id),
  has_paid BOOLEAN NOT NULL DEFAULT 0,
  payment_date TEXT,
  payment_method TEXT,
  transaction_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Music subscriptions table
CREATE TABLE IF NOT EXISTS music_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  subscription_type TEXT NOT NULL,
  start_date TEXT NOT NULL DEFAULT (datetime('now')),
  end_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  preview_start_seconds INTEGER NOT NULL DEFAULT 0,
  preview_duration_seconds INTEGER NOT NULL DEFAULT 30,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User song selections table
CREATE TABLE IF NOT EXISTS user_song_selections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  song_id TEXT NOT NULL REFERENCES songs(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, song_id)
);

-- User music settings table
CREATE TABLE IF NOT EXISTS user_music_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  volume_level REAL NOT NULL DEFAULT 0.5,
  music_enabled BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Animorph cards table
CREATE TABLE IF NOT EXISTS animorph_cards (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  power INTEGER NOT NULL,
  health INTEGER NOT NULL,
  attack INTEGER NOT NULL,
  sats INTEGER NOT NULL,
  size INTEGER NOT NULL,
  image_url TEXT,
  nft_name TEXT,
  card_number INTEGER NOT NULL,
  animorph_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- VIP codes table
CREATE TABLE IF NOT EXISTS vip_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User presence table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id TEXT PRIMARY KEY REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2FA authentication table
CREATE TABLE IF NOT EXISTS two_factor_auth (
  user_id TEXT PRIMARY KEY REFERENCES profiles(id),
  totp_secret TEXT,
  backup_codes TEXT,
  webauthn_credentials TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cloudflare errors table
CREATE TABLE IF NOT EXISTS cloudflare_errors (
  id TEXT PRIMARY KEY,
  error_message TEXT NOT NULL,
  command TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'unresolved',
  worker TEXT,
  stack_trace TEXT
);

-- Pending scripts table
CREATE TABLE IF NOT EXISTS pending_scripts (
  id TEXT PRIMARY KEY,
  script TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  executed_at TEXT,
  created_by TEXT,
  result TEXT
);
