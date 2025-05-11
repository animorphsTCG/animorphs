
-- D1 Migration Script for Animorphs Game
-- This would be run using wrangler d1 execute <database-name> --file=d1-migration.sql

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  name TEXT,
  surname TEXT,
  age INTEGER,
  gender TEXT,
  country TEXT,
  mp INTEGER DEFAULT 0,
  ai_points INTEGER DEFAULT 0,
  lbp INTEGER DEFAULT 0,
  digi INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,
  music_unlocked BOOLEAN DEFAULT FALSE,
  favorite_battle_mode TEXT,
  favorite_animorph TEXT,
  online_times_gmt2 TEXT,
  profile_image_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create payment_status table
CREATE TABLE IF NOT EXISTS payment_status (
  id TEXT PRIMARY KEY,
  has_paid BOOLEAN DEFAULT FALSE,
  payment_date TEXT,
  payment_method TEXT,
  transaction_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create music_subscriptions table
CREATE TABLE IF NOT EXISTS music_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_type TEXT NOT NULL,
  start_date TEXT DEFAULT (datetime('now')),
  end_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'online',
  last_seen TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create battle_lobbies table
CREATE TABLE IF NOT EXISTS battle_lobbies (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  name TEXT NOT NULL,
  battle_type TEXT DEFAULT '1v1',
  status TEXT DEFAULT 'waiting',
  max_players INTEGER DEFAULT 2,
  use_music BOOLEAN DEFAULT FALSE,
  use_timer BOOLEAN DEFAULT FALSE,
  requires_payment BOOLEAN DEFAULT FALSE,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,
  metadata TEXT
);

-- Create lobby_participants table
CREATE TABLE IF NOT EXISTS lobby_participants (
  id TEXT PRIMARY KEY,
  lobby_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  player_number INTEGER NOT NULL,
  is_ready BOOLEAN DEFAULT FALSE,
  join_time TEXT DEFAULT (datetime('now')),
  left_at TEXT
);

-- Create battle_sessions table
CREATE TABLE IF NOT EXISTS battle_sessions (
  id TEXT PRIMARY KEY,
  battle_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  winner_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create battle_participants table
CREATE TABLE IF NOT EXISTS battle_participants (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL,
  user_id TEXT,
  is_ai BOOLEAN DEFAULT FALSE,
  player_number INTEGER NOT NULL,
  rounds_won INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create battle_player_decks table
CREATE TABLE IF NOT EXISTS battle_player_decks (
  id TEXT PRIMARY KEY,
  battle_session_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  deck_data TEXT NOT NULL,
  current_index INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create battle_state table
CREATE TABLE IF NOT EXISTS battle_state (
  id TEXT PRIMARY KEY,
  battle_session_id TEXT NOT NULL,
  current_round INTEGER DEFAULT 1,
  current_turn_user_id TEXT,
  selected_stat TEXT,
  cards_revealed BOOLEAN DEFAULT FALSE,
  is_sudden_death BOOLEAN DEFAULT FALSE,
  sudden_death_round INTEGER DEFAULT 0,
  last_updated TEXT DEFAULT (datetime('now'))
);

-- Create indices for frequently queried fields
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_battle_lobbies_status ON battle_lobbies(status);
CREATE INDEX idx_lobby_participants_lobby_id ON lobby_participants(lobby_id);
CREATE INDEX idx_battle_participants_battle_id ON battle_participants(battle_id);
