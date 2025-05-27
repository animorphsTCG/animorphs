
<?php
require_once __DIR__ . '/../common/Database.php';

class NFTController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function syncNFTs($params) {
        $input = json_decode(file_get_contents('php://input'), true);
        $walletAddress = $input['wallet_address'] ?? '';
        
        if (empty($walletAddress)) {
            http_response_code(400);
            return json_encode(['error' => 'Wallet address is required']);
        }
        
        try {
            // Get user ID from wallet address
            $user = $this->db->fetchOne(
                "SELECT id FROM users WHERE wallet_address = ?",
                [$walletAddress]
            );
            
            if (!$user) {
                http_response_code(404);
                return json_encode(['error' => 'User not found']);
            }
            
            // Mock NFT sync - in production, this would check Polygon blockchain
            $mockOwnedTokens = $this->getMockOwnedTokens($walletAddress);
            
            $syncedCount = 0;
            foreach ($mockOwnedTokens as $tokenId) {
                // Check if card exists
                $card = $this->db->fetchOne(
                    "SELECT token_id FROM cards WHERE token_id = ?",
                    [$tokenId]
                );
                
                if ($card) {
                    // Add or update user_cards
                    $existing = $this->db->fetchOne(
                        "SELECT quantity FROM user_cards WHERE user_id = ? AND token_id = ?",
                        [$user['id'], $tokenId]
                    );
                    
                    if ($existing) {
                        $this->db->query(
                            "UPDATE user_cards SET quantity = quantity + 1 WHERE user_id = ? AND token_id = ?",
                            [$user['id'], $tokenId]
                        );
                    } else {
                        $this->db->query(
                            "INSERT INTO user_cards (user_id, token_id, quantity, acquired_at) VALUES (?, ?, 1, NOW())",
                            [$user['id'], $tokenId]
                        );
                    }
                    $syncedCount++;
                }
            }
            
            // Get updated card collection
            $userCards = $this->db->fetchAll(
                "SELECT uc.*, c.* FROM user_cards uc 
                 JOIN cards c ON uc.token_id = c.token_id 
                 WHERE uc.user_id = ?",
                [$user['id']]
            );
            
            return json_encode([
                'synced' => $syncedCount,
                'cards' => $userCards
            ]);
            
        } catch (Exception $e) {
            error_log("NFT sync error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'NFT sync failed']);
        }
    }
    
    private function getMockOwnedTokens($walletAddress) {
        // Mock NFT ownership - in production, query Polygon blockchain
        $mockTokens = [];
        
        // Generate some mock owned tokens based on wallet address
        $hash = crc32($walletAddress);
        for ($i = 1; $i <= 200; $i++) {
            if (($hash + $i) % 7 === 0) { // Mock ownership pattern
                $mockTokens[] = $i;
            }
        }
        
        return array_slice($mockTokens, 0, 50); // Limit to 50 for demo
    }
}
