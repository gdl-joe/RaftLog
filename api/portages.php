<?php
require_once __DIR__ . '/bootstrap.php';

$user   = Auth::require();
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;
$db     = Database::get();

if ($method === 'GET' && !$id) {
    $sort = in_array($_GET['sort'] ?? '', ['name','distance_m'], true) ? $_GET['sort'] : 'name';
    $stmt = $db->prepare("
        SELECT p.*, COUNT(DISTINCT t.id) AS trip_count
        FROM portages p LEFT JOIN trips t ON t.trip_type='portage' AND t.water_id = p.id
        GROUP BY p.id ORDER BY $sort ASC
    ");
    $stmt->execute();
    Response::json($stmt->fetchAll());
}

if ($method === 'GET' && $id) {
    $stmt = $db->prepare("
        SELECT p.*, COUNT(DISTINCT t.id) AS trip_count
        FROM portages p LEFT JOIN trips t ON t.trip_type='portage' AND t.water_id = p.id
        WHERE p.id = ? GROUP BY p.id
    ");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) Response::notFound('Portage nicht gefunden');
    Response::json($row);
}

if ($method === 'POST') {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $b = getBody();
    if (empty($b['name'])) Response::error('name erforderlich');
    $newId = slugify($b['name']) . '-' . substr(uniqid(), -4);
    $db->prepare("
        INSERT INTO portages (id, name, region, country, start_lat, start_lng, end_lat, end_lng,
            distance_m, elevation_gain_m, notes, created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ")->execute([
        $newId, $b['name'], $b['region'] ?? null, $b['country'] ?? null,
        $b['start_lat'] ?? null, $b['start_lng'] ?? null,
        $b['end_lat']   ?? null, $b['end_lng']   ?? null,
        $b['distance_m'] ?? null, $b['elevation_gain_m'] ?? null,
        $b['notes'] ?? null, $user['id'],
    ]);
    $stmt = $db->prepare('SELECT * FROM portages WHERE id = ?');
    $stmt->execute([$newId]);
    Response::json($stmt->fetch(), 201);
}

if ($method === 'PATCH' && $id) {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $b = getBody();
    $cols = ['name','region','country','start_lat','start_lng','end_lat','end_lng','distance_m','elevation_gain_m','notes'];
    $set = []; $vals = [];
    foreach ($cols as $c) if (array_key_exists($c, $b)) { $set[] = "$c=?"; $vals[] = $b[$c]; }
    if ($set) { $vals[] = $id; $db->prepare("UPDATE portages SET " . implode(',', $set) . " WHERE id=?")->execute($vals); }
    $stmt = $db->prepare('SELECT * FROM portages WHERE id = ?');
    $stmt->execute([$id]);
    Response::json($stmt->fetch());
}

if ($method === 'DELETE' && $id) {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $db->prepare('DELETE FROM portages WHERE id=?')->execute([$id]);
    Response::json(['ok' => true]);
}

Response::error('Method not allowed', 405);
