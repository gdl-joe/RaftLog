<?php
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Config laden
$cfg = require __DIR__ . '/../config/config.php';

// CORS für Dev-Server und Produktions-Domain
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $cfg['allowed_origins'] ?? [], true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../lib/Database.php';
require_once __DIR__ . '/../lib/Auth.php';
require_once __DIR__ . '/../lib/Response.php';

// .env laden, falls vorhanden
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (!isset($line[0]) || $line[0] === '#') continue;
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;
        $_ENV[trim($parts[0])] = trim($parts[1]);
    }
}

function getBody(): array
{
    $raw = file_get_contents('php://input');
    return $raw ? (json_decode($raw, true) ?? []) : [];
}

function slugify(string $str): string
{
    $str = mb_strtolower($str, 'UTF-8');
    $str = strtr($str, ['ä'=>'ae','ö'=>'oe','ü'=>'ue','ß'=>'ss','é'=>'e','è'=>'e','ê'=>'e','à'=>'a','â'=>'a']);
    $str = preg_replace('/[^a-z0-9]+/', '-', $str);
    return trim($str, '-');
}

function calcDuration(?string $start, ?string $end): ?int
{
    if (!$start || !$end) return null;
    [$sh, $sm] = explode(':', $start);
    [$eh, $em] = explode(':', $end);
    $mins = ((int)$eh * 60 + (int)$em) - ((int)$sh * 60 + (int)$sm);
    return $mins < 0 ? $mins + 1440 : $mins;
}

// Erlaubt für $cfg in Endpoints
function appConfig(): array
{
    return require __DIR__ . '/../config/config.php';
}
