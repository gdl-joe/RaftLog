<?php
require_once __DIR__ . '/bootstrap.php';

$user   = Auth::require();
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;
$db     = Database::get();

if ($method === 'GET' && !$id) {
    $sort = in_array($_GET['sort'] ?? '', ['name','depth_m','length_m'], true) ? $_GET['sort'] : 'name';
    $country = $_GET['country'] ?? null;
    $where = $country ? 'WHERE c.country = ?' : '';
    $params = $country ? [$country] : [];
    $stmt = $db->prepare("
        SELECT c.*, COUNT(DISTINCT t.id) AS trip_count
        FROM caves c LEFT JOIN trips t ON t.trip_type='cave' AND t.water_id = c.id
        $where
        GROUP BY c.id
        ORDER BY $sort ASC
    ");
    $stmt->execute($params);
    Response::json($stmt->fetchAll());
}

if ($method === 'GET' && $id) {
    $stmt = $db->prepare("
        SELECT c.*, COUNT(DISTINCT t.id) AS trip_count
        FROM caves c LEFT JOIN trips t ON t.trip_type='cave' AND t.water_id = c.id
        WHERE c.id = ? GROUP BY c.id
    ");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) Response::notFound('Höhle nicht gefunden');
    Response::json($row);
}

if ($method === 'POST') {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $b = getBody();
    if (empty($b['name'])) Response::error('name erforderlich');
    $newId = slugify($b['name']) . '-' . substr(uniqid(), -4);
    $db->prepare("
        INSERT INTO caves (id, name, region, country, lat, lng, depth_m, length_m, type, discovered_year, notes, created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ")->execute([
        $newId,
        $b['name'], $b['region'] ?? null, $b['country'] ?? null,
        $b['lat'] ?? null, $b['lng'] ?? null,
        $b['depth_m'] ?? null, $b['length_m'] ?? null,
        $b['type'] ?? null, $b['discovered_year'] ?? null,
        $b['notes'] ?? null, $user['id'],
    ]);
    $stmt = $db->prepare('SELECT * FROM caves WHERE id = ?');
    $stmt->execute([$newId]);
    Response::json($stmt->fetch(), 201);
}

if ($method === 'PATCH' && $id) {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $b = getBody();
    $cols = ['name','region','country','lat','lng','depth_m','length_m','type','discovered_year','notes'];
    $set = []; $vals = [];
    foreach ($cols as $c) if (array_key_exists($c, $b)) { $set[] = "$c=?"; $vals[] = $b[$c]; }
    if ($set) { $vals[] = $id; $db->prepare("UPDATE caves SET " . implode(',', $set) . " WHERE id=?")->execute($vals); }
    $stmt = $db->prepare('SELECT * FROM caves WHERE id = ?');
    $stmt->execute([$id]);
    Response::json($stmt->fetch());
}

if ($method === 'DELETE' && $id) {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $db->prepare('DELETE FROM caves WHERE id=?')->execute([$id]);
    Response::json(['ok' => true]);
}

Response::error('Method not allowed', 405);
