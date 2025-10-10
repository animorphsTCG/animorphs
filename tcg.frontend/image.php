<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$requestedFile = $_GET['file'] ?? '';
if (!$requestedFile) {
    http_response_code(400);
    echo "Missing file parameter.";
    exit;
}

try {
    // Connect to PostgreSQL
    $pdo = new PDO(
        'pgsql:host=' . $_ENV['TCG_DB_HOST'] . ';dbname=' . $_ENV['TCG_DB_NAME'],
        $_ENV['TCG_DB_USER'],
        $_ENV['TCG_DB_PASS']
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Validate the file path exists in the database (with variations)
    $stmt = $pdo->prepare("SELECT card_image FROM animorph_cards WHERE card_image ILIKE :path LIMIT 1");
    $param = $requestedFile;
    $row = null;
    $stmt->execute([':path' => $param]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        $paramClean = ltrim($requestedFile, '/');
        if ($paramClean !== $requestedFile) {
            $stmt->execute([':path' => $paramClean]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
        }
    }
    if (!$row) {
        $paramAlt = str_starts_with($requestedFile, 'tcg.frontend/') ? substr($requestedFile, strlen('tcg.frontend/')) : $requestedFile;
        $paramAlt = ltrim($paramAlt, '/');
        if ($paramAlt !== $requestedFile) {
            $stmt->execute([':path' => $paramAlt]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
        }
    }
    if (!$row) {
        http_response_code(404);
        echo "Image not found in database.";
        exit;
    }

    // Resolve file path on disk
    $filePath = $requestedFile;
    if (!file_exists($filePath)) {
        if ($filePath[0] === '/') {
            if (str_starts_with($filePath, '/tcg.frontend/')) {
                $tryPath = __DIR__ . substr($filePath, strlen('/tcg.frontend'));
                if (file_exists($tryPath)) {
                    $filePath = $tryPath;
                }
            }
        } else {
            $tryPath = __DIR__ . '/' . $filePath;
            if (file_exists($tryPath)) {
                $filePath = $tryPath;
            } else if (str_starts_with($filePath, 'tcg.frontend/')) {
                $altPath = __DIR__ . '/' . substr($filePath, strlen('tcg.frontend/'));
                if (file_exists($altPath)) {
                    $filePath = $altPath;
                }
            }
        }
    }
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo "Image file missing on disk.";
        exit;
    }

    // Serve the file
    $mime = mime_content_type($filePath);
    header("Content-Type: $mime");
    readfile($filePath);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo "Server error: " . $e->getMessage();
    exit;
}
