
<?php
require_once __DIR__ . '/../common/Database.php';
require_once __DIR__ . '/../common/Config.php';

class PaymentController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function createCheckout($params) {
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? '';
        
        if (!in_array($type, ['deck', 'battle_pass'])) {
            http_response_code(400);
            return json_encode(['error' => 'Invalid payment type']);
        }
        
        try {
            // Get current user (would be from auth middleware)
            $userId = 1; // Mock user ID for now
            
            // Set amounts based on type
            $amount = $type === 'deck' ? 100.00 : 30.00;
            $currency = 'ZAR';
            
            // Create transaction record
            $this->db->query(
                "INSERT INTO transactions (user_id, type, amount, currency, yoco_id, created_at) VALUES (?, ?, ?, ?, NULL, NOW())",
                [$userId, $type, $amount, $currency]
            );
            
            $transactionId = $this->db->lastInsertId();
            
            // Create YoCo checkout session (mock implementation)
            $checkoutUrl = $this->createYoCoCheckout($transactionId, $amount, $currency, $type);
            
            return json_encode([
                'checkout_url' => $checkoutUrl,
                'transaction_id' => $transactionId
            ]);
            
        } catch (Exception $e) {
            error_log("Create checkout error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to create checkout']);
        }
    }
    
    public function getTransactionStatus($params) {
        $transactionId = $params['transactionId'] ?? null;
        
        if (!$transactionId) {
            http_response_code(400);
            return json_encode(['error' => 'Transaction ID is required']);
        }
        
        try {
            $transaction = $this->db->fetchOne(
                "SELECT * FROM transactions WHERE id = ?",
                [$transactionId]
            );
            
            if (!$transaction) {
                http_response_code(404);
                return json_encode(['error' => 'Transaction not found']);
            }
            
            // Mock status check - in production, verify with YoCo API
            $status = $transaction['yoco_id'] ? 'completed' : 'pending';
            
            return json_encode([
                'status' => $status,
                'transaction' => $transaction
            ]);
            
        } catch (Exception $e) {
            error_log("Get transaction status error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get transaction status']);
        }
    }
    
    private function createYoCoCheckout($transactionId, $amount, $currency, $type) {
        // Mock YoCo integration - in production, use YoCo API
        $yocoPublicKey = Config::get('yoco.public_key');
        
        // For now, return a mock checkout URL
        return "https://sandbox.yoco.com/checkout?amount=" . ($amount * 100) . "&currency=" . $currency . "&reference=" . $transactionId;
    }
}
