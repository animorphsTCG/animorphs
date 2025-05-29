
<?php

class AIController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function saveConfig() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['openai_key']) || !$input['openai_key']) {
            http_response_code(400);
            echo json_encode(['error' => 'OpenAI API key is required']);
            return;
        }

        // Encrypt the API key before storing
        $encryptedKey = $this->encryptApiKey($input['openai_key']);
        
        try {
            $stmt = $this->db->prepare("
                INSERT INTO ai_config (config_key, config_value, updated_at) 
                VALUES ('openai_api_key', ?, NOW()) 
                ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = NOW()
            ");
            $stmt->execute([$encryptedKey]);
            
            echo json_encode(['message' => 'Configuration saved successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save configuration']);
        }
    }
    
    public function uploadKnowledge() {
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'No file uploaded or upload error']);
            return;
        }
        
        $file = $_FILES['file'];
        $allowedTypes = ['txt', 'md', 'json', 'php', 'js', 'ts', 'tsx', 'jsx'];
        $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($fileExt, $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['error' => 'File type not allowed']);
            return;
        }
        
        $content = file_get_contents($file['tmp_name']);
        
        try {
            $stmt = $this->db->prepare("
                INSERT INTO ai_knowledge (filename, content, file_type, uploaded_at) 
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$file['name'], $content, $fileExt]);
            
            echo json_encode(['message' => 'Knowledge file uploaded successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save knowledge file']);
        }
    }
    
    public function chat() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['message']) || !$input['message']) {
            http_response_code(400);
            echo json_encode(['error' => 'Message is required']);
            return;
        }
        
        // Get OpenAI API key
        $apiKey = $this->getDecryptedApiKey();
        if (!$apiKey) {
            http_response_code(400);
            echo json_encode(['error' => 'OpenAI API key not configured']);
            return;
        }
        
        // Get knowledge context
        $context = $this->getKnowledgeContext();
        
        // Prepare OpenAI request
        $messages = [
            [
                'role' => 'system',
                'content' => $this->getSystemPrompt() . "\n\nKnowledge Context:\n" . $context
            ],
            [
                'role' => 'user',
                'content' => $input['message']
            ]
        ];
        
        $response = $this->callOpenAI($apiKey, $messages);
        
        if ($response) {
            echo json_encode(['response' => $response]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to get AI response']);
        }
    }
    
    private function encryptApiKey($key) {
        $encryptionKey = Config::get('ENCRYPTION_KEY', 'default-key-change-in-production');
        return base64_encode(openssl_encrypt($key, 'AES-256-CBC', $encryptionKey, 0, substr(md5($encryptionKey), 0, 16)));
    }
    
    private function decryptApiKey($encryptedKey) {
        $encryptionKey = Config::get('ENCRYPTION_KEY', 'default-key-change-in-production');
        return openssl_decrypt(base64_decode($encryptedKey), 'AES-256-CBC', $encryptionKey, 0, substr(md5($encryptionKey), 0, 16));
    }
    
    private function getDecryptedApiKey() {
        try {
            $stmt = $this->db->prepare("SELECT config_value FROM ai_config WHERE config_key = 'openai_api_key'");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                return $this->decryptApiKey($result['config_value']);
            }
            return null;
        } catch (PDOException $e) {
            return null;
        }
    }
    
    private function getKnowledgeContext() {
        try {
            $stmt = $this->db->prepare("SELECT filename, content FROM ai_knowledge ORDER BY uploaded_at DESC LIMIT 10");
            $stmt->execute();
            $knowledge = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $context = "";
            foreach ($knowledge as $file) {
                $context .= "\n\nFile: {$file['filename']}\n" . substr($file['content'], 0, 2000);
            }
            
            return $context;
        } catch (PDOException $e) {
            return "";
        }
    }
    
    private function getSystemPrompt() {
        return "You are an AI development assistant for the Animorphs TCG project. You have access to the codebase and can help with:
        1. Code analysis and debugging
        2. Feature development and implementation
        3. Server deployment and configuration
        4. Database management and optimization
        5. Build automation and testing
        
        The project uses:
        - Frontend: React + TypeScript + TailwindCSS + Vite
        - Backend: PHP + MariaDB + Apache on Contabo VPS
        - Blockchain: Polygon (Matic) with ERC-1155 NFTs
        - Services: Epic Online Services (EOS), YoCo payments
        
        Provide helpful, accurate development assistance based on the knowledge context and user questions.";
    }
    
    private function callOpenAI($apiKey, $messages) {
        $url = 'https://api.openai.com/v1/chat/completions';
        
        $data = [
            'model' => 'gpt-4',
            'messages' => $messages,
            'max_tokens' => 2000,
            'temperature' => 0.7
        ];
        
        $options = [
            'http' => [
                'header' => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $apiKey
                ],
                'method' => 'POST',
                'content' => json_encode($data)
            ]
        ];
        
        $context = stream_context_create($options);
        $result = file_get_contents($url, false, $context);
        
        if ($result === FALSE) {
            return null;
        }
        
        $response = json_decode($result, true);
        
        if (isset($response['choices'][0]['message']['content'])) {
            return $response['choices'][0]['message']['content'];
        }
        
        return null;
    }
}
