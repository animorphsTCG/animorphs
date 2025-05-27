
<?php
require_once __DIR__ . '/../common/Database.php';

class MusicController {
    private $db;
    private $musicPath = '/media/ZypherDan/';
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function getSongs($params) {
        try {
            $songs = $this->db->fetchAll("SELECT * FROM songs ORDER BY title");
            return json_encode($songs);
        } catch (Exception $e) {
            error_log("Get songs error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get songs']);
        }
    }
    
    public function getUserSongs($params) {
        $userId = $params['userId'] ?? null;
        
        if (!$userId) {
            http_response_code(400);
            return json_encode(['error' => 'User ID is required']);
        }
        
        try {
            // Check if user has battle pass
            $user = $this->db->fetchOne(
                "SELECT has_battle_pass, battle_pass_expires FROM users WHERE id = ?",
                [$userId]
            );
            
            if (!$user) {
                http_response_code(404);
                return json_encode(['error' => 'User not found']);
            }
            
            if ($user['has_battle_pass'] && $user['battle_pass_expires'] > date('Y-m-d')) {
                // Battle pass holder - return all songs
                $songs = $this->db->fetchAll("SELECT * FROM songs ORDER BY title");
            } else {
                // Free user - return selected songs only
                $songs = $this->db->fetchAll(
                    "SELECT s.* FROM songs s 
                     JOIN user_songs us ON s.id = us.song_id 
                     WHERE us.user_id = ? 
                     ORDER BY s.title",
                    [$userId]
                );
            }
            
            return json_encode($songs);
            
        } catch (Exception $e) {
            error_log("Get user songs error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get user songs']);
        }
    }
    
    public function selectFreeSongs($params) {
        $input = json_decode(file_get_contents('php://input'), true);
        $songIds = $input['song_ids'] ?? [];
        
        if (count($songIds) > 5) {
            http_response_code(400);
            return json_encode(['error' => 'Maximum 5 songs allowed for free users']);
        }
        
        try {
            // Get current user (would be from auth middleware)
            $userId = 1; // Mock user ID for now
            
            // Remove existing selections
            $this->db->query("DELETE FROM user_songs WHERE user_id = ?", [$userId]);
            
            // Add new selections
            foreach ($songIds as $songId) {
                $this->db->query(
                    "INSERT INTO user_songs (user_id, song_id) VALUES (?, ?)",
                    [$userId, $songId]
                );
            }
            
            return json_encode(['success' => true]);
            
        } catch (Exception $e) {
            error_log("Select free songs error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to select songs']);
        }
    }
    
    public function scanMusicDirectory() {
        // Utility method to scan music directory and populate songs table
        $directories = ['good', 'kids&teens', 'great', 'ok_songs'];
        $scannedSongs = [];
        
        foreach ($directories as $dir) {
            $path = $this->musicPath . $dir;
            if (is_dir($path)) {
                $files = glob($path . '/*.mp3');
                foreach ($files as $file) {
                    $filename = basename($file);
                    $title = pathinfo($filename, PATHINFO_FILENAME);
                    $duration = 180; // Mock duration in seconds
                    
                    $scannedSongs[] = [
                        'title' => $title,
                        'file_path' => str_replace($this->musicPath, '', $file),
                        'duration' => $duration
                    ];
                }
            }
        }
        
        return $scannedSongs;
    }
}
