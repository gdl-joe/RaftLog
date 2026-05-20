<?php
require_once __DIR__ . '/bootstrap.php';

Auth::require();
$db     = Database::get();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $tripId = $_GET['trip_id'] ?? '';
    if (!$tripId) Response::error('trip_id fehlt');
    $stmt = $db->prepare(
        'SELECT id, path, thumb_path, large_path, caption, taken_at, gps_lat, gps_lng,
                width, height, sort_order
         FROM photos WHERE trip_id = ?
         ORDER BY COALESCE(taken_at, created_at) ASC, sort_order ASC, id ASC'
    );
    // created_at gibt es nicht in photos — Workaround: nur taken_at sortieren
    $stmt = $db->prepare(
        'SELECT id, path, thumb_path, large_path, caption, taken_at, gps_lat, gps_lng,
                width, height, sort_order
         FROM photos WHERE trip_id = ?
         ORDER BY COALESCE(taken_at, "1970-01-01") ASC, sort_order ASC, id ASC'
    );
    $stmt->execute([$tripId]);
    Response::json($stmt->fetchAll());
}

if ($method === 'PATCH') {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $id = $_GET['id'] ?? '';
    if (!$id) Response::error('id fehlt');
    $b = getBody();
    $cols = ['caption','sort_order'];
    $set = []; $vals = [];
    foreach ($cols as $c) if (array_key_exists($c, $b)) { $set[] = "$c=?"; $vals[] = $b[$c]; }
    if ($set) { $vals[] = $id; $db->prepare("UPDATE photos SET " . implode(',', $set) . " WHERE id=?")->execute($vals); }
    Response::json(['ok' => true]);
}

if ($method === 'DELETE') {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $id = $_GET['id'] ?? '';
    if (!$id) Response::error('id fehlt');

    $stmt = $db->prepare('SELECT path, thumb_path, large_path FROM photos WHERE id = ?');
    $stmt->execute([$id]);
    $photo = $stmt->fetch();
    if (!$photo) Response::notFound();

    $base = __DIR__ . '/..';
    foreach (['path','thumb_path','large_path'] as $col) {
        if ($photo[$col]) @unlink($base . $photo[$col]);
    }
    $db->prepare('DELETE FROM photos WHERE id = ?')->execute([$id]);
    Response::json(['ok' => true]);
}

Response::error('Method not allowed', 405);
