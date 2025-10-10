<?php
function getDatabaseConnection(): PDO {
    // Load .env manually
    $envPath = '/home/.env';

    if (!file_exists($envPath)) {
        throw new Exception("Missing /home/.env");
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];

    foreach ($lines as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $env[trim($key)] = trim($value);
    }

    $dbHost = $env['TCG_DB_HOST'] ?? 'localhost';
    $dbName = $env['TCG_DB_NAME'] ?? 'tcg';
    $dbUser = $env['TCG_DB_USER'] ?? null;
    $dbPass = $env['TCG_DB_PASS'] ?? null;

    if (!$dbUser || !$dbPass) {
        throw new Exception("Missing TCG_DB_USER or TCG_DB_PASS in /home/.env");
    }

    return new PDO("pgsql:host=$dbHost;dbname=$dbName", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
}