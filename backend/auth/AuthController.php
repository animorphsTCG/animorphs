
<?php
require_once __DIR__ . '/../common/Database.php';
require_once __DIR__ . '/../common/Config.php';

class AuthController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function login($params) {
        $input = json_decode(file_get_contents('php://input'), true);
        $eosId = $input['eos_id'] ?? '';
        $walletAddress = $input['wallet_address'] ?? null;
        
        if (empty($eosId)) {
            http_response_code(400);
            return json_encode(['error' => 'EOS ID is required']);
        }
        
        try {
            // Check if user exists
            $user = $this->db->fetchOne(
                "SELECT * FROM users WHERE eos_id = ?",
                [$eosId]
            );
            
            if (!$user) {
                // Create new user
                $this->db->query(
                    "INSERT INTO users (eos_id, wallet_address, has_battle_pass, created_at) VALUES (?, ?, FALSE, NOW())",
                    [$eosId, $walletAddress]
                );
                $userId = $this->db->lastInsertId();
                
                $user = $this->db->fetchOne(
                    "SELECT * FROM users WHERE id = ?",
                    [$userId]
                );
            } else if ($walletAddress && $user['wallet_address'] !== $walletAddress) {
                // Update wallet address
                $this->db->query(
                    "UPDATE users SET wallet_address = ? WHERE id = ?",
                    [$walletAddress, $user['id']]
                );
                $user['wallet_address'] = $walletAddress;
            }
            
            // Generate JWT token
            $token = $this->generateJWT($user['id'], $eosId);
            
            return json_encode([
                'user' => $user,
                'token' => $token
            ]);
            
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Login failed']);
        }
    }
    
    public function profile($params) {
        $user = $this->getCurrentUser();
        if (!$user) {
            http_response_code(401);
            return json_encode(['error' => 'Unauthorized']);
        }
        
        return json_encode($user);
    }
    
    private function generateJWT($userId, $eosId) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $userId,
            'eos_id' => $eosId,
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ]);
        
        $headerEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $payloadEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, Config::get('jwt_secret'), true);
        $signatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
    }
    
    private function getCurrentUser() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (!str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }
        
        $token = substr($authHeader, 7);
        $payload = $this->verifyJWT($token);
        
        if (!$payload) {
            return null;
        }
        
        return $this->db->fetchOne(
            "SELECT * FROM users WHERE id = ?",
            [$payload['user_id']]
        );
    }
    
    private function verifyJWT($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        
        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
        
        $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $signatureEncoded));
        $expectedSignature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, Config::get('jwt_secret'), true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            return null;
        }
        
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payloadEncoded)), true);
        
        if ($payload['exp'] < time()) {
            return null;
        }
        
        return $payload;
    }
}
