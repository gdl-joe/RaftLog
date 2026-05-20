<?php
require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = Database::get();

// GET /api/users — Admin-Liste
if ($method === 'GET') {
    Auth::requireAdmin();
    $stmt = $db->query("SELECT id, handle, name, email, role, last_login, created_at FROM users ORDER BY created_at ASC");
    Response::json($stmt->fetchAll());
}

// PATCH /api/users?id=…  — Profil aktualisieren (self) oder Rolle (admin)
if ($method === 'PATCH') {
    $u = Auth::require();
    Auth::verifyCsrf();
    $id = (int)($_GET['id'] ?? $u['id']);
    $isSelf = ($id === (int)$u['id']);
    if (!$isSelf && $u['role'] !== 'admin') Response::error('Keine Berechtigung', 403);

    $b = getBody();
    $set = []; $vals = [];

    // Felder, die jeder für sich selbst ändern darf
    if (isset($b['name']))   { $set[] = 'name=?';   $vals[] = $b['name']; }
    if (isset($b['handle'])) { $set[] = 'handle=?'; $vals[] = $b['handle']; }
    if (isset($b['email']))  { $set[] = 'email=?';  $vals[] = $b['email']; }
    if (isset($b['prefs']))  { $set[] = 'prefs=?';  $vals[] = json_encode($b['prefs'], JSON_UNESCAPED_UNICODE); }
    if (isset($b['password']) && $b['password']) {
        $set[] = 'password_hash=?';
        $vals[] = password_hash($b['password'], PASSWORD_BCRYPT);
    }

    // Nur Admin: Rolle ändern
    if (isset($b['role']) && $u['role'] === 'admin') {
        if (!in_array($b['role'], ['admin','viewer'], true)) Response::error('Ungültige Rolle');
        $set[] = 'role=?'; $vals[] = $b['role'];
    }

    if (!$set) Response::error('Keine Änderungen');
    $vals[] = $id;
    $db->prepare('UPDATE users SET ' . implode(',', $set) . ' WHERE id=?')->execute($vals);

    $stmt = $db->prepare('SELECT id, handle, name, email, role, prefs FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    if ($user['prefs']) $user['prefs'] = json_decode($user['prefs'], true);
    Response::json($user);
}

Response::error('Method not allowed', 405);
