<?php
require_once __DIR__ . '/bootstrap.php';

$user   = Auth::require();
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;
$db     = Database::get();

if ($method === 'GET' && !$id) {
    $sort = in_array($_GET['sort'] ?? '', ['name','area_km2'], true) ? $_GET['sort'] : 'name';
    $country = $_GET['country'] ?? null;
    $where = $country ? 'WHERE l.country = ?' : '';
    $params = $country ? [$country] : [];
    $stmt = $db->prepare("
        SELECT l.*, COUNT(DISTINCT t.id) AS trip_count
        FROM lakes l
        LEFT JOIN trips t ON t.trip_type='lake' AND t.water_id = l.id
        $where
        GROUP BY l.id
        ORDER BY $sort ASC
    ");
    $stmt->execute($params);
    Response::json($stmt->fetchAll());
}

if ($method === 'GET' && $id) {
    $stmt = $db->prepare("
        SELECT l.*, COUNT(DISTINCT t.id) AS trip_count
        FROM lakes l LEFT JOIN trips t ON t.trip_type='lake' AND t.water_id = l.id
        WHERE l.id = ? GROUP BY l.id
    ");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) Response::notFound('See nicht gefunden');
    Response::json($row);
}

if ($method === 'POST') {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $b = getBody();
    if (empty($b['name'])) Response::error('name erforderlich');
    $newId = slugify($b['name']) . '-' . substr(uniqid(), -4);
    $db->prepare("
        INSERT INTO lakes (id, name, region, country, lat, lng, area_km2, depth_max_m, notes, created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    ")->execute([
        $newId,
        $b['name'], $b['region'] ?? null, $b['country'] ?? null,
        $b['lat'] ?? null, $b['lng'] ?? null,
        $b['area_km2'] ?? null, $b['depth_max_m'] ?? null,
        $b['notes'] ?? null, $user['id'],
    ]);
    $stmt = $db->prepare('SELECT * FROM lakes WHERE id = ?');
    $stmt->execute([$newId]);
    Response::json($stmt->fetch(), 201);
}

if ($method === 'PATCH' && $id) {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $b = getBody();
    $cols = ['name','region','country','lat','lng','area_km2','depth_max_m','notes'];
    $set = []; $vals = [];
    foreach ($cols as $c) if (array_key_exists($c, $b)) { $set[] = "$c=?"; $vals[] = $b[$c]; }
    if ($set) { $vals[] = $id; $db->prepare("UPDATE lakes SET " . implode(',', $set) . " WHERE id=?")->execute($vals); }
    $stmt = $db->prepare('SELECT * FROM lakes WHERE id = ?');
    $stmt->execute([$id]);
    Response::json($stmt->fetch());
}

if ($method === 'DELETE' && $id) {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $db->prepare('DELETE FROM lakes WHERE id=?')->execute([$id]);
    Response::json(['ok' => true]);
}

Response::error('Method not allowed', 405);
