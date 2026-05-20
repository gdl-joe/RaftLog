<?php
declare(strict_types=1);

class GpxParser
{
    /**
     * Parst eine GPX-Datei in eine vereinfachte Punkt-Liste und berechnet
     * Distanz, Dauer, Höhenmeter und Bounding-Box.
     *
     * @param string $path  Pfad zur GPX-Datei
     * @param int    $maxPoints  Maximale Punkte (Reduzierung via simpler Stride)
     * @return array{points: array, distance_km: float, duration_s: int, ele_gain_m: int, bbox: array}
     */
    public static function parse(string $path, int $maxPoints = 2000): array
    {
        $xml = @simplexml_load_file($path);
        if (!$xml) {
            throw new \RuntimeException('GPX konnte nicht geparst werden');
        }

        // GPX hat Namespace — registrieren für XPath-Suche
        $ns = $xml->getNamespaces(true);
        $defaultNs = $ns[''] ?? null;
        if ($defaultNs) {
            $xml->registerXPathNamespace('g', $defaultNs);
            $trkpts = $xml->xpath('//g:trkpt');
        } else {
            $trkpts = $xml->xpath('//trkpt');
        }

        if (!$trkpts) {
            // Routen oder Waypoints fallback
            $trkpts = $defaultNs
                ? $xml->xpath('//g:rtept')
                : $xml->xpath('//rtept');
        }

        if (!$trkpts) {
            throw new \RuntimeException('Keine Trackpunkte in GPX gefunden');
        }

        $points = [];
        foreach ($trkpts as $pt) {
            $attrs = $pt->attributes();
            $lat = isset($attrs['lat']) ? (float)$attrs['lat'] : null;
            $lng = isset($attrs['lon']) ? (float)$attrs['lon'] : null;
            if ($lat === null || $lng === null) continue;

            $children = $defaultNs ? $pt->children($defaultNs) : $pt->children();
            $ele = isset($children->ele) ? (float)$children->ele : null;
            $t   = isset($children->time) ? (string)$children->time : null;

            $points[] = [
                'lat' => round($lat, 6),
                'lng' => round($lng, 6),
                'ele' => $ele !== null ? round($ele, 1) : null,
                't'   => $t,
            ];
        }

        // Optionale Reduzierung
        if (count($points) > $maxPoints) {
            $stride = (int)ceil(count($points) / $maxPoints);
            $reduced = [];
            for ($i = 0; $i < count($points); $i += $stride) {
                $reduced[] = $points[$i];
            }
            // Letzten Punkt immer behalten
            if (end($reduced) !== end($points)) {
                $reduced[] = end($points);
            }
            $points = $reduced;
        }

        // Distanz (Haversine, in km)
        $distanceKm = 0.0;
        for ($i = 1; $i < count($points); $i++) {
            $distanceKm += self::haversine(
                $points[$i - 1]['lat'], $points[$i - 1]['lng'],
                $points[$i]['lat'],     $points[$i]['lng']
            );
        }

        // Dauer (Sekunden zwischen erstem/letztem Timestamp)
        $durationS = 0;
        $firstT = $points[0]['t'] ?? null;
        $lastT  = end($points)['t'] ?? null;
        if ($firstT && $lastT) {
            $durationS = max(0, strtotime($lastT) - strtotime($firstT));
        }

        // Höhenmeter (kumulierte positive Differenz)
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
