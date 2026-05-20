<?php
require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$path   = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$parts  = explode('/', $path);
$action = end($parts);

switch ($action) {
    case 'me':
        if ($method !== 'GET') Response::error('Method not allowed', 405);
        $u = Auth::user();
        if (!$u) Response::json(null);
        unset($u['password_hash']);
        Response::json($u);

    case 'csrf':
        if ($method !== 'GET') Response::error('Method not allowed', 405);
        Response::json(['csrf' => Auth::csrf()]);

    case 'login':
        if ($method !== 'POST') Response::error('Method not allowed', 405);
        $body = getBody();
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        if (!$email || !$password) Response::error('E-Mail und Passwort erforderlich');
        if (!Auth::login($email, $password)) Response::error('Ungültige Anmeldedaten', 401);
        $u = Auth::user();
        unset($u['password_hash']);
        Response::json(['user' => $u, 'csrf' => Auth::csrf()]);

    case 'logout':
        if ($method !== 'POST') Response::error('Method not allowed', 405);
        Auth::verifyCsrf();
        Auth::logout();
        Response::json(['ok' => true]);

    default:
        Response::notFound();
}
