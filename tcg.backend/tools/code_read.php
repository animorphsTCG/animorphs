<?php
// /var/www/tcg.backend/tools/code_read.php
// Read-only, whitelisted code fetcher. Returns text/plain so I can “see” files directly.
// SECURITY: Only allows files inside tcg.backend and tcg.frontend; blocks sensitive dirs.

ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: text/plain; charset=utf-8');

$baseAllow = [
  '/var/www/tcg.backend',
  '/var/www/html/tcg.frontend',
];

// Directories we NEVER expose
$denyDirs = [
  '/var/www/tcg.backend/eos',
  '/var/www/tcg.backend/kws',
  '/var/www/tcg.backend/lib',
  '/var/www/tcg.backend/venv',
  '/var/www/tcg.backend/error-log',
  '/var/www/html/tcg.frontend/eos',
  '/var/www/html/tcg.frontend/kws',
];

// Allowed file extensions
$allowExt = ['php','js','ts','css','html','htm','json','sql','txt','md','ini','conf','sh'];

$req = $_GET['path'] ?? '';
if ($req === '') { http_response_code(400); echo "Missing ?path"; exit; }

// Normalize path
$real = realpath($req);
if ($real === false) { http_response_code(404); echo "Not found"; exit; }

// Must be under allowed bases
$allowedBase = false;
foreach ($baseAllow as $b) {
  if (str_starts_with($real, $b)) { $allowedBase = true; break; }
}
if (!$allowedBase) { http_response_code(403); echo "Forbidden (base)"; exit; }

// Must not be in denied dirs
foreach ($denyDirs as $d) {
  if (str_starts_with($real, $d)) { http_response_code(403); echo "Forbidden (dir)"; exit; }
}

// Must have allowed extension
$ext = strtolower(pathinfo($real, PATHINFO_EXTENSION));
if (!in_array($ext, $allowExt, true)) { http_response_code(403); echo "Forbidden (ext)"; exit; }

// Don’t serve huge files
if (filesize($real) > 2*1024*1024) { http_response_code(413); echo "Too large"; exit; }

// Stream file
$fh = fopen($real, 'rb');
if (!$fh) { http_response_code(500); echo "Open failed"; exit; }
fpassthru($fh);
