
-- Animorphs TCG Database Schema
-- MariaDB version 10.6.22

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    eos_id VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255),
    wallet_address VARCHAR(255),
    has_battle_pass BOOLEAN DEFAULT FALSE,
    battle_pass_expires DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_eos_id (eos_id),
    INDEX idx_wallet (wallet_address)
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
    token_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    element ENUM('Fire','Water','Ice','Ground','Electric') NOT NULL,
    power INT NOT NULL,
    health INT NOT NULL,
    attack INT NOT NULL,
    sats INT NOT NULL,
    size INT NOT NULL,
    metadata_uri VARCHAR(255),
    INDEX idx_element (element)
);

-- User cards ownership table
CREATE TABLE IF NOT EXISTS user_cards (
    user_id INT,
    token_id INT,
    quantity INT DEFAULT 1,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, token_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(token_id) REFERENCES cards(token_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('deck','battle_pass') NOT NULL,
    amount DECIMAL(8,2) NOT NULL,
    currency CHAR(3) DEFAULT 'ZAR',
    yoco_id VARCHAR(64),
    status ENUM('pending','completed','failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_yoco_id (yoco_id),
    INDEX idx_status (status)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player1 INT NOT NULL,
    player2 INT,
    result ENUM('win','lose','draw','ongoing') DEFAULT 'ongoing',
    rounds JSON,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player1) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(player2) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_player1 (player1),
    INDEX idx_player2 (player2),
    INDEX idx_played_at (played_at)
);

-- Leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
    user_id INT PRIMARY KEY,
    lbp_points INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    total_matches INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lbp_points (lbp_points DESC),
    INDEX idx_total_wins (total_wins DESC)
);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in seconds',
    category ENUM('good','kids&teens','great','ok_songs') DEFAULT 'good',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_title (title)
);

-- User songs table (for free user selections)
CREATE TABLE IF NOT EXISTS user_songs (
    user_id INT,
    song_id INT,
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, song_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- Insert sample card data (200 cards across 5 elements)
INSERT IGNORE INTO cards (token_id, name, element, power, health, attack, sats, size) VALUES
-- Fire cards (1-40)
(1, 'Flame Dragon', 'Fire', 85, 90, 40, 7, 4),
(2, 'Fire Wolf', 'Fire', 70, 75, 35, 5, 3),
(3, 'Phoenix', 'Fire', 95, 80, 45, 8, 5),
(4, 'Lava Golem', 'Fire', 80, 100, 30, 6, 4),
(5, 'Fire Sprite', 'Fire', 60, 65, 30, 4, 2),
-- Water cards (41-80)
(41, 'Sea Dragon', 'Water', 85, 95, 35, 7, 4),
(42, 'Water Elemental', 'Water', 75, 80, 40, 6, 3),
(43, 'Kraken', 'Water', 100, 85, 50, 9, 5),
(44, 'Tide Guardian', 'Water', 70, 90, 25, 5, 3),
(45, 'Water Nymph', 'Water', 65, 70, 35, 4, 2),
-- Ice cards (81-120)
(81, 'Frost Dragon', 'Ice', 80, 85, 40, 7, 4),
(82, 'Ice Golem', 'Ice', 75, 95, 30, 6, 4),
(83, 'Blizzard Wolf', 'Ice', 70, 70, 45, 5, 3),
(84, 'Crystal Guardian', 'Ice', 85, 80, 35, 6, 3),
(85, 'Frost Fairy', 'Ice', 55, 60, 30, 3, 2),
-- Ground cards (121-160)
(121, 'Earth Dragon', 'Ground', 90, 100, 35, 8, 5),
(122, 'Rock Golem', 'Ground', 85, 110, 25, 7, 4),
(123, 'Sand Warrior', 'Ground', 75, 80, 40, 5, 3),
(124, 'Mountain Giant', 'Ground', 95, 120, 30, 9, 5),
(125, 'Earth Sprite', 'Ground', 60, 75, 25, 4, 2),
-- Electric cards (161-200)
(161, 'Lightning Dragon', 'Electric', 90, 75, 50, 8, 4),
(162, 'Thunder Wolf', 'Electric', 80, 70, 45, 6, 3),
(163, 'Storm Giant', 'Electric', 85, 80, 40, 7, 4),
(164, 'Electric Fairy', 'Electric', 65, 60, 35, 4, 2),
(165, 'Volt Guardian', 'Electric', 75, 75, 40, 5, 3);

-- Insert sample songs data
INSERT IGNORE INTO songs (title, file_path, duration, category) VALUES
('Epic Battle Theme', 'good/epic_battle.mp3', 240, 'good'),
('Adventure Song', 'good/adventure.mp3', 180, 'good'),
('Victory Fanfare', 'good/victory.mp3', 120, 'good'),
('Peaceful Melody', 'kids&teens/peaceful.mp3', 200, 'kids&teens'),
('Fun Times', 'kids&teens/fun_times.mp3', 150, 'kids&teens'),
('Hero Theme', 'great/hero_theme.mp3', 300, 'great'),
('Dark Forest', 'great/dark_forest.mp3', 280, 'great'),
('Simple Tune', 'ok_songs/simple.mp3', 90, 'ok_songs'),
('Background Music', 'ok_songs/background.mp3', 160, 'ok_songs');
