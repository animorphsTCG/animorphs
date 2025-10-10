<?php
// File: /var/www/tcg.backend/session_check.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
    echo json_encode([
        "status" => "error",
        "message" => "User not logged in."
    ]);
    exit;
}

// Return session user details
echo json_encode([
    "status" => "ok",
    "user_id" => $_SESSION['user_id'],
    "username" => $_SESSION['username']
]);
exit;
