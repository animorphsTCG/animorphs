
-- Migration for Cloudflare errors table
CREATE TABLE IF NOT EXISTS cloudflare_errors (
  id TEXT PRIMARY KEY,
  error_message TEXT NOT NULL,
  command TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'unresolved',
  worker TEXT,
  stack_trace TEXT
);

-- Index for faster lookups by status and timestamp
CREATE INDEX IF NOT EXISTS idx_errors_status ON cloudflare_errors(status);
CREATE INDEX IF NOT EXISTS idx_errors_timestamp ON cloudflare_errors(timestamp);
