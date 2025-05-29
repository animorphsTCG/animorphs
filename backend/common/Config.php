
<?php
class Config {
    private static $config = null;
    
    public static function load() {
        if (self::$config !== null) {
            return self::$config;
        }
        
        // Load environment variables
        if (file_exists(__DIR__ . '/../.env')) {
            $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && !str_starts_with($line, '#')) {
                    list($key, $value) = explode('=', $line, 2);
                    $_ENV[trim($key)] = trim($value);
                }
            }
        }
        
        self::$config = [
            'db' => [
                'host' => $_ENV['DB_HOST'] ?? 'localhost',
                'port' => $_ENV['DB_PORT'] ?? '3306',
                'name' => $_ENV['DB_NAME'] ?? 'animorph_cards',
                'user' => $_ENV['DB_USER'] ?? 'lovable_admin',
                'pass' => $_ENV['DB_PASS'] ?? 'zwsQGJtuhRwQu7M',
            ],
            'eos' => [
                'client_id' => $_ENV['EOS_CLIENT_ID'] ?? '',
                'client_secret' => $_ENV['EOS_CLIENT_SECRET'] ?? '',
                'product_id' => $_ENV['EOS_PRODUCT_ID'] ?? '',
                'sandbox_id' => $_ENV['EOS_SANDBOX_ID'] ?? '',
                'deployment_id' => $_ENV['EOS_DEPLOYMENT_ID'] ?? '',
                'redirect_uri' => $_ENV['EOS_REDIRECT_URI'] ?? '',
            ],
            'yoco' => [
                'public_key' => $_ENV['YOCO_PUBLIC_KEY'] ?? '',
                'secret_key' => $_ENV['YOCO_SECRET_KEY'] ?? '',
            ],
            'blockchain' => [
                'private_key' => $_ENV['ETH_PRIVATE_KEY'] ?? '',
                'polygon_rpc' => $_ENV['POLYGON_RPC_URL'] ?? 'https://polygon-rpc.com',
            ],
            'jwt_secret' => $_ENV['JWT_SECRET'] ?? 'animorphs_secret_key_2024',
        ];
        
        return self::$config;
    }
    
    public static function get($key, $default = null) {
        $config = self::load();
        $keys = explode('.', $key);
        $value = $config;
        
        foreach ($keys as $k) {
            if (!isset($value[$k])) {
                return $default;
            }
            $value = $value[$k];
        }
        
        return $value;
    }
}
