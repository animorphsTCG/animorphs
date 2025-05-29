
-- AI Assistant database tables

CREATE TABLE IF NOT EXISTS ai_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_knowledge (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_chat_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for better performance
CREATE INDEX idx_ai_config_key ON ai_config(config_key);
CREATE INDEX idx_ai_knowledge_type ON ai_knowledge(file_type);
CREATE INDEX idx_ai_chat_session ON ai_chat_history(session_id, created_at);
