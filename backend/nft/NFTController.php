
<?php
require_once __DIR__ . '/../common/Database.php';

class NFTController {
    private $db;
    private $contractAddress = '0xb08882e1804B444171B560Cf7cEe99aDD26f7f62';
    
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
            
            // Clear existing user cards for fresh sync
            $this->db->query(
                "DELETE FROM user_cards WHERE user_id = ?",
                [$user['id']]
            );
            
            // Get owned NFTs from blockchain (mock for now, will be real Polygon query in production)
            $ownedTokens = $this->getOwnedNFTs($walletAddress);
            
            $syncedCount = 0;
            foreach ($ownedTokens as $tokenId) {
                // Verify token exists in our animorph_cards table
                $card = $this->db->fetchOne(
                    "SELECT token_id FROM animorph_cards WHERE token_id = ?",
                    [$tokenId]
                );
                
                if ($card) {
                    // Add to user_cards
                    $this->db->query(
                        "INSERT INTO user_cards (user_id, token_id, quantity, acquired_at, last_synced) 
                         VALUES (?, ?, 1, NOW(), NOW())",
                        [$user['id'], $tokenId]
                    );
                    $syncedCount++;
                }
            }
            
            // Get updated card collection with full card details
            $userCards = $this->db->fetchAll(
                "SELECT uc.*, ac.* FROM user_cards uc 
                 JOIN animorph_cards ac ON uc.token_id = ac.token_id 
                 WHERE uc.user_id = ?
                 ORDER BY ac.animorph_type, ac.token_id",
                [$user['id']]
            );
            
            return json_encode([
                'synced' => $syncedCount,
                'total_owned' => count($userCards),
                'cards' => $userCards
            ]);
            
        } catch (Exception $e) {
            error_log("NFT sync error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'NFT sync failed: ' . $e->getMessage()]);
        }
    }
    
    private function getOwnedNFTs($walletAddress) {
        // TODO: Replace with real Polygon RPC call
        // This would query the blockchain for NFTs owned by the wallet address
        // at contract 0xb08882e1804B444171B560Cf7cEe99aDD26f7f62
        
        // Mock implementation for development
        $mockTokens = [];
        $hash = crc32($walletAddress);
        
        // Generate mock ownership pattern based on wallet address
        for ($i = 1; $i <= 201; $i++) {
            if ($i === 43) continue; // Skip token 43 as it doesn't exist
            
            if (($hash + $i) % 5 === 0) { // Mock 20% ownership rate
                $mockTokens[] = $i;
            }
        }
        
        return array_slice($mockTokens, 0, 50); // Limit for demo
    }
    
    private function queryPolygonRPC($walletAddress) {
        // Real implementation would use Web3 RPC calls
        $rpcUrl = $_ENV['POLYGON_RPC_URL'] ?? 'https://polygon-rpc.com';
        
        // Query contract for NFT balances
        // This is a placeholder for the actual Web3 implementation
        return [];
    }
}
