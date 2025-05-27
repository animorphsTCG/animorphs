
<?php
require_once __DIR__ . '/../common/Database.php';

class BattleController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function createMatch($params) {
        $input = json_decode(file_get_contents('php://input'), true);
        $opponentId = $input['opponent_id'] ?? null;
        
        // Get current user (would be from auth middleware)
        $playerId = 1; // Mock player ID for now
        
        try {
            $this->db->query(
                "INSERT INTO matches (player1, player2, result, rounds, played_at) VALUES (?, ?, 'ongoing', '[]', NOW())",
                [$playerId, $opponentId]
            );
            
            $matchId = $this->db->lastInsertId();
            
            $match = $this->db->fetchOne(
                "SELECT * FROM matches WHERE id = ?",
                [$matchId]
            );
            
            return json_encode($match);
            
        } catch (Exception $e) {
            error_log("Create match error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to create match']);
        }
    }
    
    public function getMatch($params) {
        $matchId = $params['matchId'] ?? null;
        
        if (!$matchId) {
            http_response_code(400);
            return json_encode(['error' => 'Match ID is required']);
        }
        
        try {
            $match = $this->db->fetchOne(
                "SELECT * FROM matches WHERE id = ?",
                [$matchId]
            );
            
            if (!$match) {
                http_response_code(404);
                return json_encode(['error' => 'Match not found']);
            }
            
            return json_encode($match);
            
        } catch (Exception $e) {
            error_log("Get match error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get match']);
        }
    }
    
    public function makeMove($params) {
        $matchId = $params['matchId'] ?? null;
        $input = json_decode(file_get_contents('php://input'), true);
        $move = $input['move'] ?? null;
        
        if (!$matchId || !$move) {
            http_response_code(400);
            return json_encode(['error' => 'Match ID and move are required']);
        }
        
        try {
            // Get current match
            $match = $this->db->fetchOne(
                "SELECT * FROM matches WHERE id = ?",
                [$matchId]
            );
            
            if (!$match) {
                http_response_code(404);
                return json_encode(['error' => 'Match not found']);
            }
            
            // Process move and update match
            $rounds = json_decode($match['rounds'], true) ?: [];
            $rounds[] = [
                'timestamp' => date('Y-m-d H:i:s'),
                'move' => $move
            ];
            
            $this->db->query(
                "UPDATE matches SET rounds = ? WHERE id = ?",
                [json_encode($rounds), $matchId]
            );
            
            // Get updated match
            $updatedMatch = $this->db->fetchOne(
                "SELECT * FROM matches WHERE id = ?",
                [$matchId]
            );
            
            return json_encode($updatedMatch);
            
        } catch (Exception $e) {
            error_log("Make move error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to make move']);
        }
    }
}
