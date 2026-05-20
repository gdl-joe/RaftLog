<?php
declare(strict_types=1);

class GpxParser
{
    /**
     * Parst eine GPX-Datei in eine vereinfachte Punkt-Liste und berechnet
     * Distanz, Dauer, Höhenmeter und Bounding-Box.
     *
     * Robust gegenüber verschiedenen GPX-Namespaces (Garmin, Komoot, Strava, OSM).
     * Erkennt trkpt (Track-Punkte), rtept (Route-Punkte), wpt (Waypoints) als Fallback.
     *
     * @param string $path  Pfad zur GPX-Datei
     * @param int    $maxPoints  Maximale Punkte (Reduzierung via Stride)
     * @return array{points: array, distance_km: float, duration_s: int, ele_gain_m: int, bbox: array}
     * @throws \RuntimeException
     */
    public static function parse(string $path, int $maxPoints = 2000): array
    {
        if (!file_exists($path)) {
            throw new \RuntimeException('GPX-Datei nicht gefunden');
        }
        if (!extension_loaded('simplexml')) {
            throw new \RuntimeException('PHP-Extension simplexml fehlt');
        }

        $raw = @file_get_contents($path);
        if ($raw === false || $raw === '') {
            throw new \RuntimeException('GPX-Datei ist leer oder nicht lesbar');
        }

        // BOM entfernen
        $raw = preg_replace('/^\xEF\xBB\xBF/', '', $raw);

        // Robuster Parse-Versuch: alle Namespaces vor dem Parsen entfernen,
        // damit XPath ohne Namespace-Präfix funktioniert.
        // Das ist tolerant gegenüber Garmin (Namespace 1/1), Komoot (1/1), Strava, etc.
        $stripped = preg_replace('/xmlns(?::[a-zA-Z0-9]+)?\s*=\s*"[^"]*"/', '', $raw);

        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($stripped);
        if (!$xml) {
            $errors = libxml_get_errors();
            libxml_clear_errors();
            $msg = $errors ? trim($errors[0]->message) : 'unbekannt';
            throw new \RuntimeException('XML-Parsing fehlgeschlagen: ' . $msg);
        }

        // Suche zuerst nach trkpt, dann rtept, dann wpt als Fallback
        $trkpts = $xml->xpath('//trkpt');
        if (!$trkpts) $trkpts = $xml->xpath('//rtept');
        if (!$trkpts) $trkpts = $xml->xpath('//wpt');

        if (!$trkpts || count($trkpts) === 0) {
            throw new \RuntimeException('Keine Track-, Route- oder Waypoints in GPX gefunden');
        }

        $points = [];
        foreach ($trkpts as $pt) {
            $attrs = $pt->attributes();
            $lat = isset($attrs['lat']) ? (float)$attrs['lat'] : null;
            $lng = isset($attrs['lon']) ? (float)$attrs['lon'] : null;
            if ($lat === null || $lng === null) continue;
            if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) continue;

            $ele = isset($pt->ele) ? (float)$pt->ele : null;
            $t   = isset($pt->time) ? (string)$pt->time : null;

            $points[] = [
                'lat' => round($lat, 6),
                'lng' => round($lng, 6),
                'ele' => $ele !== null ? round($ele, 1) : null,
                't'   => $t,
            ];
        }

        if (count($points) === 0) {
            throw new \RuntimeException('Keine gültigen Koordinaten in GPX');
        }

        // Optionale Reduzierung (Decimation)
        if (count($points) > $maxPoints) {
            $stride = (int)ceil(count($points) / $maxPoints);
            $reduced = [];
            for ($i = 0; $i < count($points); $i += $stride) {
                $reduced[] = $points[$i];
            }
            if (end($reduced) !== end($points)) {
                $reduced[] = end($points);
            }
            $points = $reduced;
        }

        // Distanz (Haversine)
        $distanceKm = 0.0;
        for ($i = 1; $i < count($points); $i++) {
            $distanceKm += self::haversine(
                $points[$i - 1]['lat'], $points[$i - 1]['lng'],
                $points[$i]['lat'],     $points[$i]['lng']
            );
        }

        // Dauer
        $durationS = 0;
        $firstT = $points[0]['t'] ?? null;
        $lastT  = end($points)['t'] ?? null;
        if ($firstT && $lastT) {
            $ts1 = strtotime($firstT);
            $ts2 = strtotime($lastT);
            if ($ts1 !== false && $ts2 !== false) {
                $durationS = max(0, $ts2 - $ts1);
            }
        }

        // Höhenmeter
        $eleGain = 0;
        $lastEle = null;
        foreach ($points as $p) {
            if ($p['ele'] !== null) {
                if ($lastEle !== null && $p['ele'] > $lastEle) {
                    $eleGain += ($p['ele'] - $lastEle);
                }
                $lastEle = $p['ele'];
            }
        }

        // Bounding-Box
        $lats = array_column($points, 'lat');
        $lngs = array_column($points, 'lng');
        $bbox = [
            'n' => max($lats), 's' => min($lats),
            'e' => max($lngs), 'w' => min($lngs),
        ];

        return [
            'points'      => $points,
            'distance_km' => round($distanceKm, 2),
            'duration_s'  => $durationS,
            'ele_gain_m'  => (int)round($eleGain),
            'bbox'        => $bbox,
        ];
    }

    private static function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $r * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
