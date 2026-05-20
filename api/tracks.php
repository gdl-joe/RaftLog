<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../lib/GpxParser.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;
$db     = Database::get();
$cfg    = appConfig();

// ── GET /api/tracks?trip_id=…  oder ?id=… ─────────────────
if ($method === 'GET') {
    Auth::require();
    if ($id) {
        $stmt = $db->prepare("SELECT * FROM trip_tracks WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) Response::notFound();
        if ($row['points_json']) $row['points'] = json_decode($row['points_json'], true);
        unset($row['points_json']);
        Response::json($row);
    }
    $tripId = $_GET['trip_id'] ?? '';
    if (!$tripId) Response::error('trip_id fehlt');
    $stmt = $db->prepare("
        SELECT id, trip_id, source, gpx_path, point_count, distance_km, duration_s,
               ele_gain_m, bbox_n, bbox_s, bbox_e, bbox_w, created_at
        FROM trip_tracks WHERE trip_id = ? ORDER BY id ASC
    ");
    $stmt->execute([$tripId]);
    Response::json($stmt->fetchAll());
}

// ── POST /api/tracks (multipart oder json) ────────────────
if ($method === 'POST') {
    Auth::requireAdmin();
    Auth::verifyCsrf();

    // Variante A — GPX-Datei-Upload
    if (!empty($_FILES['gpx'])) {
        $tripId = $_POST['trip_id'] ?? '';
        if (!$tripId) Response::error('trip_id fehlt');

        $file = $_FILES['gpx'];

        // Detaillierte Fehlermeldung je nach PHP-Upload-Fehler
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $msg = match ($file['error']) {
                UPLOAD_ERR_INI_SIZE   => 'Datei ist größer als upload_max_filesize in PHP-Config',
                UPLOAD_ERR_FORM_SIZE  => 'Datei ist größer als MAX_FILE_SIZE im Formular',
                UPLOAD_ERR_PARTIAL    => 'Datei wurde nur teilweise hochgeladen',
                UPLOAD_ERR_NO_FILE    => 'Keine Datei hochgeladen',
                UPLOAD_ERR_NO_TMP_DIR => 'Kein temporäres Verzeichnis verfügbar',
                UPLOAD_ERR_CANT_WRITE => 'Datei konnte nicht auf den Server geschrieben werden',
                UPLOAD_ERR_EXTENSION  => 'PHP-Extension hat den Upload blockiert',
                default => 'Unbekannter Upload-Fehler (Code ' . $file['error'] . ')',
            };
            Response::error($msg, 400);
        }

        if ($file['size'] > 20 * 1024 * 1024) Response::error('Max. 20 MB pro GPX');
        if ($file['size'] === 0) Response::error('GPX-Datei ist leer');

        // Trip-ID für Pfad bereinigen — auch t-2026-05-20-… ist OK
        $safeTripId = preg_replace('/[^a-zA-Z0-9\-]/', '', $tripId);
        if (!$safeTripId) Response::error('Ungültige trip_id');

        $dir = rtrim($cfg['upload_dir'], '/') . '/tracks/' . $safeTripId . '/';
        if (!is_dir($dir)) {
            if (!@mkdir($dir, 0755, true) && !is_dir($dir)) {
                Response::error('Track-Verzeichnis konnte nicht erstellt werden: ' . $dir, 500);
            }
        }
        if (!is_writable($dir)) {
            Response::error('Track-Verzeichnis ist nicht beschreibbar: ' . $dir, 500);
        }

        $name = bin2hex(random_bytes(6)) . '.gpx';
        $dest = $dir . $name;
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            Response::error('Datei konnte nicht gespeichert werden (move_uploaded_file)', 500);
        }

        try {
            $parsed = GpxParser::parse($dest);
        } catch (\Throwable $e) {
            @unlink($dest);
            Response::error('GPX-Parsing fehlgeschlagen: ' . $e->getMessage());
        }

        $relPath = '/uploads/tracks/' . $safeTripId . '/' . $name;
        $stmt = $db->prepare("
            INSERT INTO trip_tracks
            (trip_id, source, gpx_path, points_json, point_count, distance_km, duration_s,
             ele_gain_m, bbox_n, bbox_s, bbox_e, bbox_w)
            VALUES (?, 'gpx_import', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $tripId, $relPath,
            json_encode($parsed['points'], JSON_UNESCAPED_UNICODE),
            count($parsed['points']),
            $parsed['distance_km'], $parsed['duration_s'], $parsed['ele_gain_m'],
            $parsed['bbox']['n'], $parsed['bbox']['s'],
            $parsed['bbox']['e'], $parsed['bbox']['w'],
        ]);
        Response::json([
            'id'          => (int)$db->lastInsertId(),
            'gpx_path'    => $relPath,
            'point_count' => count($parsed['points']),
            'distance_km' => $parsed['distance_km'],
            'duration_s'  => $parsed['duration_s'],
            'ele_gain_m'  => $parsed['ele_gain_m'],
            'bbox'        => $parsed['bbox'],
        ], 201);
    }

    // Variante B — Live-Tracking-Punkte als JSON
    $b = getBody();
    $tripId = $b['trip_id'] ?? '';
    $points = $b['points'] ?? [];
    if (!$tripId || !is_array($points) || !$points) Response::error('trip_id und points erforderlich');

    // Bounding-Box + Distanz berechnen
    $lats = array_column($points, 'lat');
    $lngs = array_column($points, 'lng');
    $dist = 0.0;
    for ($i = 1; $i < count($points); $i++) {
        $dist += haversine($points[$i-1]['lat'], $points[$i-1]['lng'], $points[$i]['lat'], $points[$i]['lng']);
    }
    $durationS = 0;
    if (!empty($points[0]['t']) && !empty($points[count($points)-1]['t'])) {
        $durationS = max(0, (int)$points[count($points)-1]['t'] - (int)$points[0]['t']);
    }

    $stmt = $db->prepare("
        INSERT INTO trip_tracks
        (trip_id, source, points_json, point_count, distance_km, duration_s, bbox_n, bbox_s, bbox_e, bbox_w)
        VALUES (?, 'live', ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $tripId,
        json_encode($points, JSON_UNESCAPED_UNICODE),
        count($points), round($dist, 2), $durationS,
        max($lats), min($lats), max($lngs), min($lngs),
    ]);
    Response::json(['id' => (int)$db->lastInsertId(), 'point_count' => count($points), 'distance_km' => round($dist, 2)], 201);
}

// ── DELETE /api/tracks?id=… ──────────────────────────────
if ($method === 'DELETE' && $id) {
    Auth::requireAdmin();
    Auth::verifyCsrf();
    $stmt = $db->prepare('SELECT gpx_path FROM trip_tracks WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if ($row && $row['gpx_path']) {
        @unlink(__DIR__ . '/..' . $row['gpx_path']);
    }
    $db->prepare('DELETE FROM trip_tracks WHERE id = ?')->execute([$id]);
    Response::json(['ok' => true]);
}

Response::error('Method not allowed', 405);

function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
{
    $r = 6371.0;
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    $a = sin($dLat / 2) ** 2
        + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
    return $r * 2 * atan2(sqrt($a), sqrt(1 - $a));
}
