<?php
require_once __DIR__ . '/bootstrap.php';

Auth::require();
$db = Database::get();

// KPIs gesamt
$kpi = $db->query("
    SELECT
        COUNT(*)                         AS total_trips,
        COUNT(DISTINCT water_id)         AS total_waters,
        COALESCE(SUM(distance_km), 0)    AS total_km,
        COALESCE(SUM(duration_min), 0)   AS total_minutes,
        COALESCE(MAX(distance_km), 0)    AS longest_km,
        MIN(date_from)                   AS first_trip,
        MAX(date_from)                   AS last_trip
    FROM trips
")->fetch();

// KM pro Jahr × Typ
$yearlyByType = $db->query("
    SELECT YEAR(date_from) AS year, trip_type,
           COUNT(*)                       AS trips,
           COALESCE(SUM(distance_km), 0)  AS km
    FROM trips
    GROUP BY YEAR(date_from), trip_type
    ORDER BY year DESC, trip_type ASC
")->fetchAll();

// Top-Gewässer (top 8, alle Typen gemischt mit Anzeige des Typs)
$topWaters = $db->query("
    SELECT t.trip_type, t.water_id,
        COALESCE(r.name, l.name, c.name, p.name) AS name,
        COUNT(*) AS visits,
        COALESCE(SUM(t.distance_km), 0) AS km
    FROM trips t
    LEFT JOIN rivers   r ON t.trip_type='river'   AND t.water_id = r.id
    LEFT JOIN lakes    l ON t.trip_type='lake'    AND t.water_id = l.id
    LEFT JOIN caves    c ON t.trip_type='cave'    AND t.water_id = c.id
    LEFT JOIN portages p ON t.trip_type='portage' AND t.water_id = p.id
    GROUP BY t.trip_type, t.water_id
    ORDER BY visits DESC
    LIMIT 8
")->fetchAll();

// WW-Grad-Verteilung (Flüsse)
$wwDist = $db->query("
    SELECT ww_grade, COUNT(*) AS count
    FROM trips WHERE trip_type='river' AND ww_grade IS NOT NULL AND ww_grade != ''
    GROUP BY ww_grade ORDER BY ww_grade
")->fetchAll();

// T/K/P Histogramm
$tkpDist = [];
foreach (['diff_t','diff_k','diff_p'] as $col) {
    $rows = $db->query("
        SELECT $col AS level, COUNT(*) AS count
        FROM trips WHERE $col IS NOT NULL
        GROUP BY $col ORDER BY $col
    ")->fetchAll();
    $tkpDist[$col] = $rows;
}

// Typen-Verteilung
$typeDist = $db->query("
    SELECT trip_type, COUNT(*) AS count, COALESCE(SUM(distance_km), 0) AS km
    FROM trips GROUP BY trip_type
")->fetchAll();

// Aktivitäts-Heatmap (letzte 365 Tage)
$heatmap = $db->query("
    SELECT date_from AS date, COUNT(*) AS count
    FROM trips
    WHERE date_from >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
    GROUP BY date_from
")->fetchAll();

Response::json([
    'kpi'           => $kpi,
    'yearlyByType'  => $yearlyByType,
    'topWaters'     => $topWaters,
    'wwDist'        => $wwDist,
    'tkpDist'       => $tkpDist,
    'typeDist'      => $typeDist,
    'heatmap'       => $heatmap,
]);
