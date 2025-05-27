
<?php
require_once __DIR__ . '/../common/Database.php';

class CardController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function getAllCards($params) {
        try {
            $cards = $this->db->fetchAll("SELECT * FROM cards ORDER BY element, token_id");
            return json_encode($cards);
        } catch (Exception $e) {
            error_log("Get all cards error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get cards']);
        }
    }
    
    public function getUserCards($params) {
        $userId = $params['userId'] ?? null;
        
        if (!$userId) {
            http_response_code(400);
            return json_encode(['error' => 'User ID is required']);
        }
        
        try {
            $userCards = $this->db->fetchAll(
                "SELECT uc.user_id, uc.token_id, uc.quantity, uc.acquired_at, c.*
                 FROM user_cards uc 
                 JOIN cards c ON uc.token_id = c.token_id 
                 WHERE uc.user_id = ? 
                 ORDER BY c.element, c.token_id",
                [$userId]
            );
            
            // Format response to match expected structure
            $formattedCards = array_map(function($row) {
                return [
                    'user_id' => $row['user_id'],
                    'token_id' => $row['token_id'],
                    'quantity' => $row['quantity'],
                    'acquired_at' => $row['acquired_at'],
                    'card' => [
                        'token_id' => $row['token_id'],
                        'name' => $row['name'],
                        'element' => $row['element'],
                        'power' => $row['power'],
                        'health' => $row['health'],
                        'attack' => $row['attack'],
                        'sats' => $row['sats'],
                        'size' => $row['size'],
                        'metadata_uri' => $row['metadata_uri']
                    ]
                ];
            }, $userCards);
            
            return json_encode($formattedCards);
            
        } catch (Exception $e) {
            error_log("Get user cards error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get user cards']);
        }
    }
}
