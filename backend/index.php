<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/common/Router.php';
require_once __DIR__ . '/common/Config.php';
require_once __DIR__ . '/auth/AuthController.php';
require_once __DIR__ . '/cards/CardController.php';
require_once __DIR__ . '/nft/NFTController.php';
require_once __DIR__ . '/battle/BattleController.php';
require_once __DIR__ . '/payments/PaymentController.php';
require_once __DIR__ . '/music/MusicController.php';
require_once __DIR__ . '/leaderboard/LeaderboardController.php';
require_once __DIR__ . '/ai/AIController.php';

// Load configuration
Config::load();

// Initialize router
$router = new Router();

// Auth routes
$authController = new AuthController();
$router->post('/auth/login', [$authController, 'login']);
$router->get('/auth/profile', [$authController, 'profile']);

// Card routes
$cardController = new CardController();
$router->get('/cards', [$cardController, 'getAllCards']);
$router->get('/cards/user/{userId}', [$cardController, 'getUserCards']);

// NFT routes
$nftController = new NFTController();
$router->post('/nft/sync', [$nftController, 'syncNFTs']);

// Battle routes
$battleController = new BattleController();
$router->post('/battle/create', [$battleController, 'createMatch']);
$router->get('/battle/match/{matchId}', [$battleController, 'getMatch']);
$router->post('/battle/match/{matchId}/move', [$battleController, 'makeMove']);

// Payment routes
$paymentController = new PaymentController();
$router->post('/payments/checkout', [$paymentController, 'createCheckout']);
$router->get('/payments/status/{transactionId}', [$paymentController, 'getTransactionStatus']);

// Music routes
$musicController = new MusicController();
$router->get('/music/songs', [$musicController, 'getSongs']);
$router->get('/music/user/{userId}', [$musicController, 'getUserSongs']);
$router->post('/music/select-free', [$musicController, 'selectFreeSongs']);

// Leaderboard routes
$leaderboardController = new LeaderboardController();
$router->get('/leaderboard', [$leaderboardController, 'getLeaderboard']);

// AI Assistant routes
$aiController = new AIController();
$router->post('/ai/config', [$aiController, 'saveConfig']);
$router->post('/ai/knowledge', [$aiController, 'uploadKnowledge']);
$router->post('/ai/chat', [$aiController, 'chat']);

// Handle the request
try {
    $router->handleRequest();
} catch (Exception $e) {
    error_log("Router error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
