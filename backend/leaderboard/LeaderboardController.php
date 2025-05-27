
<?php
require_once __DIR__ . '/../common/Database.php';

class LeaderboardController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function getLeaderboard($params) {
        try {
            $leaderboard = $this->db->fetchAll(
                "SELECT l.*, u.eos_id 
                 FROM leaderboards l 
                 JOIN users u ON l.user_id = u.id 
                 ORDER BY l.lbp_points DESC, l.total_wins DESC 
                 LIMIT 100"
            );
            
            return json_encode($leaderboard);
            
        } catch (Exception $e) {
            error_log("Get leaderboard error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get leaderboard']);
        }
    }
    
    public function updateUserStats($userId, $won = false) {
        try {
            // Check if user exists in leaderboard
            $existing = $this->db->fetchOne(
                "SELECT * FROM leaderboards WHERE user_id = ?",
                [$userId]
            );
            
            if ($existing) {
                // Update existing entry
                $pointsGain = $won ? 10 : 1; // 10 points for win, 1 for participation
                $this->db->query(
                    "UPDATE leaderboards SET 
                     lbp_points = lbp_points + ?, 
                     total_wins = total_wins + ?, 
                     total_matches = total_matches + 1 
                     WHERE user_id = ?",
                    [$pointsGain, $won ? 1 : 0, $userId]
                );
            } else {
                // Create new entry
                $pointsGain = $won ? 10 : 1;
                $this->db->query(
                    "INSERT INTO leaderboards (user_id, lbp_points, total_wins, total_matches) VALUES (?, ?, ?, 1)",
                    [$userId, $pointsGain, $won ? 1 : 0]
                );
            }
            
        } catch (Exception $e) {
            error_log("Update user stats error: " . $e->getMessage());
        }
    }
}
