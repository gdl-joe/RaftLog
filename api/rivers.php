<?php
require_once __DIR__ . '/bootstrap.php';

$user   = Auth::require();
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;
$db     = Database::get();

// ── GET /api/rivers ───────────────────────────────────────
if ($method === 'GET' && !$id) {
    $sort = in_array($_GET['sort'] ?? '', ['name','length_km'], true) ? $_GET['sort'] : 'name';
    $country = $_GET['country'] ?? null;
    $where = $country ? 'WHERE r.country = ?' : '';
    $params = $country ? [$country] : [];
    $sql = "
        SELECT r.*, COUNT(DISTINCT t.id) AS trip_count
        FROM rivers r
        LEFT JOIN trips t ON t.trip_type='river' AND t.water_id = r.id
        $where
        GROUP BY r.id
        ORDER BY $sort ASC
    ";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    Response::json($stmt->fetchAll());
}

// ── GET /api/rivers?id=… ─────────────────────────────────
if ($method === 'GET' && $id) {
    $stmt = $db->prepare("
        SELECT r.*, COUNT(DISTINCT t.id) AS trip_count
        FROM rivers r LEFT JOIN trips t ON t.trip_type='river' AND t.water_id = r.id
        WHERE r.id = ? GROUP BY r.id
    ");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) Response::notFound('Fluss nicht gefunden');
    Response::json($row);
}

// ── POST /api/rivers ─────────────────────────────────────
if ($method === 'POST') {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $b = getBody();
    if (empty($b['name'])) Response::error('name erforderlich');
    $newId = slugify($b['name']) . '-' . substr(uniqid(), -4);
    $db->prepare("
        INSERT INTO rivers (id, name, region, country, source_name, source_lat, source_lng,
            mouth_name, mouth_lat, mouth_lng, length_km, ww_grade_typical, notes, created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ")->execute([
        $newId,
        $b['name'], $b['region'] ?? null, $b['country'] ?? null,
        $b['source_name'] ?? null, $b['source_lat'] ?? null, $b['source_lng'] ?? null,
        $b['mouth_name']  ?? null, $b['mouth_lat']  ?? null, $b['mouth_lng']  ?? null,
        $b['length_km'] ?? null, $b['ww_grade_typical'] ?? null,
        $b['notes'] ?? null, $user['id'],
    ]);
    $stmt = $db->prepare('SELECT * FROM rivers WHERE id = ?');
    $stmt->execute([$newId]);
    Response::json($stmt->fetch(), 201);
}

// ── PATCH /api/rivers?id=… ───────────────────────────────
if ($method === 'PATCH' && $id) {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $b = getBody();
    $cols = ['name','region','country','source_name','source_lat','source_lng',
             'mouth_name','mouth_lat','mouth_lng','length_km','ww_grade_typical','notes'];
    $set = []; $vals = [];
    foreach ($cols as $c) {
        if (array_key_exists($c, $b)) { $set[] = "$c=?"; $vals[] = $b[$c]; }
    }
    if ($set) {
        $vals[] = $id;
        $db->prepare("UPDATE rivers SET " . implode(',', $set) . " WHERE id=?")->execute($vals);
    }
    $stmt = $db->prepare('SELECT * FROM rivers WHERE id = ?');
    $stmt->execute([$id]);
    Response::json($stmt->fetch());
}

// ── DELETE /api/rivers?id=… ──────────────────────────────
if ($method === 'DELETE' && $id) {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $db->prepare('DELETE FROM rivers WHERE id=?')->execute([$id]);
    Response::json(['ok' => true]);
}

Response::error('Method not allowed', 405);
