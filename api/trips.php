<?php
require_once __DIR__ . '/bootstrap.php';

$user   = Auth::require();
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;
$db     = Database::get();

// ── GET /api/trips ────────────────────────────────────────
if ($method === 'GET' && !$id) {
    $limit  = min((int)($_GET['limit']  ?? 30), 100);
    $offset = max((int)($_GET['offset'] ?? 0), 0);
    $type   = $_GET['type'] ?? null;
    $year   = $_GET['year'] ?? null;
    $waterId= $_GET['water_id'] ?? null;

    $w = []; $p = [];
    if ($type)    { $w[] = 'trip_type = ?';          $p[] = $type; }
    if ($year)    { $w[] = 'YEAR(date_from) = ?';    $p[] = (int)$year; }
    if ($waterId) { $w[] = 'water_id = ?';           $p[] = $waterId; }
    $where = $w ? 'WHERE ' . implode(' AND ', $w) : '';

    $total = $db->prepare("SELECT COUNT(*) FROM trips $where");
    $total->execute($p);
    $totalCount = (int)$total->fetchColumn();

    $stmt = $db->prepare("
        SELECT t.*,
               (SELECT COUNT(*) FROM photos ph WHERE ph.trip_id = t.id) AS photo_count
        FROM trips t
        $where
        ORDER BY t.date_from DESC, t.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute(array_merge($p, [$limit, $offset]));
    $trips = $stmt->fetchAll();

    foreach ($trips as &$t) {
        $t = enrichTrip($t, $db);
    }

    Response::paginated($trips, $totalCount, $limit, $offset);
}

// ── GET /api/trips?id=… ───────────────────────────────────
if ($method === 'GET' && $id) {
    $stmt = $db->prepare("SELECT * FROM trips WHERE id = ?");
    $stmt->execute([$id]);
    $trip = $stmt->fetch();
    if (!$trip) Response::notFound('Befahrung nicht gefunden');
    Response::json(enrichTrip($trip, $db, true));
}

// ── POST /api/trips ───────────────────────────────────────
if ($method === 'POST' && !$id) {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $b = getBody();

    foreach (['trip_type','water_id','title','date_from'] as $req) {
        if (empty($b[$req])) Response::error("$req fehlt");
    }
    if (!in_array($b['trip_type'], ['river','lake','cave','portage'], true)) {
        Response::error('Ungültiger trip_type');
    }

    $newId = 't-' . date('Y-m-d') . '-' . slugify($b['water_id'] ?? 'trip') . '-' . substr(uniqid(), -4);

    $db->prepare("
        INSERT INTO trips (
            id, trip_type, water_id, title, date_from, date_to, start_time, end_time, duration_min,
            diff_t, diff_k, diff_p, rating,
            distance_km, weather, notes,
            ww_grade, water_level, put_in_lat, put_in_lng, take_out_lat, take_out_lng,
            wind_beaufort, waves,
            wet, rope,
            portage_distance_m, carry_method,
            hero_icon, is_public, created_by
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ")->execute([
        $newId,
        $b['trip_type'], $b['water_id'], $b['title'],
        $b['date_from'], $b['date_to'] ?? null,
        $b['start_time'] ?? null, $b['end_time'] ?? null,
        calcDuration($b['start_time'] ?? null, $b['end_time'] ?? null),
        $b['diff_t'] ?? null, $b['diff_k'] ?? null, $b['diff_p'] ?? null, $b['rating'] ?? null,
        $b['distance_km'] ?? null, $b['weather'] ?? null, $b['notes'] ?? null,
        $b['ww_grade'] ?? null, $b['water_level'] ?? null,
        $b['put_in_lat'] ?? null, $b['put_in_lng'] ?? null,
        $b['take_out_lat'] ?? null, $b['take_out_lng'] ?? null,
        $b['wind_beaufort'] ?? null, $b['waves'] ?? null,
        $b['wet'] ?? null, $b['rope'] ?? null,
        $b['portage_distance_m'] ?? null, $b['carry_method'] ?? null,
        $b['hero_icon'] ?? $b['trip_type'],
        (int)($b['is_public'] ?? 0),
        $user['id'],
    ]);

    if (!empty($b['team']))    insertList($db, 'trip_team',    $newId, 'member_name', $b['team']);
    if (!empty($b['gear']))    insertList($db, 'trip_gear',    $newId, 'gear',        $b['gear']);
    if (!empty($b['hazards'])) insertList($db, 'trip_hazards', $newId, 'hazard',      $b['hazards']);

    $stmt = $db->prepare('SELECT * FROM trips WHERE id = ?');
    $stmt->execute([$newId]);
    Response::json(enrichTrip($stmt->fetch(), $db, true), 201);
}

// ── PATCH /api/trips?id=… ─────────────────────────────────
if ($method === 'PATCH' && $id) {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $b = getBody();
    $cols = [
        'title','date_from','date_to','start_time','end_time',
        'diff_t','diff_k','diff_p','rating',
        'distance_km','weather','notes',
        'ww_grade','water_level','put_in_lat','put_in_lng','take_out_lat','take_out_lng',
        'wind_beaufort','waves','wet','rope',
        'portage_distance_m','carry_method',
        'hero_icon','cover_photo_id','is_public',
    ];
    $set = []; $vals = [];
    foreach ($cols as $c) if (array_key_exists($c, $b)) { $set[] = "$c=?"; $vals[] = $b[$c]; }
    if (isset($b['start_time'], $b['end_time'])) {
        $set[] = 'duration_min=?'; $vals[] = calcDuration($b['start_time'], $b['end_time']);
    }
    if ($set) { $vals[] = $id; $db->prepare("UPDATE trips SET " . implode(',', $set) . " WHERE id=?")->execute($vals); }

    if (isset($b['team']))    insertList($db, 'trip_team',    $id, 'member_name', $b['team']);
    if (isset($b['gear']))    insertList($db, 'trip_gear',    $id, 'gear',        $b['gear']);
    if (isset($b['hazards'])) insertList($db, 'trip_hazards', $id, 'hazard',      $b['hazards']);

    $stmt = $db->prepare('SELECT * FROM trips WHERE id = ?');
    $stmt->execute([$id]);
    Response::json(enrichTrip($stmt->fetch(), $db, true));
}

// ── DELETE /api/trips?id=… ────────────────────────────────
if ($method === 'DELETE' && $id) {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $db->prepare('DELETE FROM trips WHERE id=?')->execute([$id]);
    Response::json(['ok' => true]);
}

Response::error('Method not allowed', 405);

// ─── Helpers ──────────────────────────────────────────────

function enrichTrip(array $t, PDO $db, bool $detailed = false): array
{
    // Wasser/Ort dazujoinen je nach trip_type
    $waterTable = ['river'=>'rivers','lake'=>'lakes','cave'=>'caves','portage'=>'portages'][$t['trip_type']] ?? null;
    if ($waterTable) {
        $stmt = $db->prepare("SELECT name, region, country FROM $waterTable WHERE id = ?");
        $stmt->execute([$t['water_id']]);
        $w = $stmt->fetch();
        $t['water_name']    = $w['name']    ?? '';
        $t['water_region']  = $w['region']  ?? null;
        $t['water_country'] = $w['country'] ?? null;
    }
    $t['difficulty'] = ['t' => (int)$t['diff_t'], 'k' => (int)$t['diff_k'], 'p' => (int)$t['diff_p']];
    $t['photos']     = (int)($t['photo_count'] ?? 0);

    // Cover-Foto bestimmen: explizit gewähltes (cover_photo_id) oder das erste
    $photo = null;
    if (!empty($t['cover_photo_id'])) {
        $p = $db->prepare('SELECT thumb_path, path, large_path FROM photos WHERE id = ? AND trip_id = ?');
        $p->execute([$t['cover_photo_id'], $t['id']]);
        $photo = $p->fetch() ?: null;
    }
    if (!$photo) {
        $p = $db->prepare('SELECT thumb_path, path, large_path FROM photos WHERE trip_id = ? ORDER BY sort_order, id LIMIT 1');
        $p->execute([$t['id']]);
        $photo = $p->fetch() ?: null;
    }
    $t['cover_photo']       = $photo ? ($photo['thumb_path'] ?? $photo['path']) : null;
    $t['cover_photo_large'] = $photo ? ($photo['large_path'] ?? $photo['path']) : null;

    if ($detailed) {
        $tm = $db->prepare('SELECT member_name FROM trip_team WHERE trip_id = ?');
        $tm->execute([$t['id']]);
        $t['team'] = $tm->fetchAll(PDO::FETCH_COLUMN);
        $gr = $db->prepare('SELECT gear FROM trip_gear WHERE trip_id = ?');
        $gr->execute([$t['id']]);
        $t['gear'] = $gr->fetchAll(PDO::FETCH_COLUMN);
        $hz = $db->prepare('SELECT hazard FROM trip_hazards WHERE trip_id = ?');
        $hz->execute([$t['id']]);
        $t['hazards'] = $hz->fetchAll(PDO::FETCH_COLUMN);
    }
    return $t;
}

function insertList(PDO $db, string $table, string $tripId, string $col, array $items): void
{
    $db->prepare("DELETE FROM $table WHERE trip_id = ?")->execute([$tripId]);
    $stmt = $db->prepare("INSERT IGNORE INTO $table (trip_id, $col) VALUES (?, ?)");
    foreach ($items as $v) if (is_string($v) && trim($v) !== '') $stmt->execute([$tripId, trim($v)]);
}
