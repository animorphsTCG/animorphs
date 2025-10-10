<?php
// File: /var/www/html/tcg.frontend/logout.php
session_start();

// Clear all session data
session_unset();
session_destroy();

// Redirect to the home page (absolute path to avoid relative path issues)
header('Location: /index.php');
exit;
