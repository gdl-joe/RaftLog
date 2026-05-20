<?php
require_once __DIR__ . '/bootstrap.php';

Auth::requireAdmin();
Auth::verifyCsrf();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') Response::error('Method not allowed', 405);

$tripId = $_POST['trip_id'] ?? '';
$caption = $_POST['caption'] ?? null;
if (!$tripId) Response::error('trip_id fehlt');

$cfg = appConfig();
$uploadDir = $cfg['upload_dir'] . '/trips/' . preg_replace('/[^a-z0-9\-]/', '', $tripId) . '/';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
    Response::error('Upload-Verzeichnis konnte nicht erstellt werden', 500);
}

$file = $_FILES['photo'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK) Response::error('Datei-Upload fehlgeschlagen');

$allowedMime = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
if (!in_array($mime, $allowedMime, true)) Response::error('Nur JPEG, PNG und HEIC erlaubt');

$maxBytes = $cfg['max_upload_mb'] * 1024 * 1024;
if ($file['size'] > $maxBytes) Response::error("Maximale Dateigröße: {$cfg['max_upload_mb']} MB");

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$ext = $ext === 'png' ? 'png' : 'jpg';
$name = bin2hex(random_bytes(8)) . '.' . $ext;
$dest = $uploadDir . $name;

if (!move_uploaded_file($file['tmp_name'], $dest)) Response::error('Speichern fehlgeschlagen', 500);

$thumbPath = $uploadDir . 'thumb_' . $name;
$largePath = $uploadDir . 'large_' . $name;
$thumbRel = $largeRel = null;
$width = $height = null;

if (extension_loaded('gd')) {
    $src = match ($mime) {
        'image/jpeg' => @imagecreatefromjpeg($dest),
        'image/png'  => @imagecreatefrompng($dest),
        default      => false,
    };
    if ($src) {
        $width  = imagesx($src);
        $height = imagesy($src);
        if (makeThumb($src, $width, $height, 400, $thumbPath)) {
            $thumbRel = '/uploads/trips/' . basename($uploadDir) . '/thumb_' . $name;
        }
        if (makeThumb($src, $width, $height, 1200, $largePath)) {
            $largeRel = '/uploads/trips/' . basename($uploadDir) . '/large_' . $name;
        }
        imagedestroy($src);
    }
}

// EXIF auslesen — Datum und GPS
$takenAt = null;
$gps = null;
if (in_array($mime, ['image/jpeg', 'image/heic', 'image/heif'], true) && function_exists('exif_read_data')) {
    $exif = @exif_read_data($dest);
    if ($exif) {
        if (!empty($exif['DateTimeOriginal'])) {
            $ts = strtotime(str_replace(':', '-', substr($exif['DateTimeOriginal'], 0, 10)) . substr($exif['DateTimeOriginal'], 10));
            if ($ts) $takenAt = date('Y-m-d H:i:s', $ts);
        }
        if (isset($exif['GPSLatitude'])) {
            $gps = [
                'lat' => exifToDecimal($exif['GPSLatitude'], $exif['GPSLatitudeRef'] ?? 'N'),
                'lng' => exifToDecimal($exif['GPSLongitude'], $exif['GPSLongitudeRef'] ?? 'E'),
            ];
        }
    }
}

$db = Database::get();
$relPath = '/uploads/trips/' . basename($uploadDir) . '/' . $name;
$stmt = $db->prepare("
    INSERT INTO photos (trip_id, path, thumb_path, large_path, caption, taken_at,
                        gps_lat, gps_lng, width, height, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            (SELECT COALESCE(MAX(sort_order),0)+1 FROM photos p2 WHERE p2.trip_id = ?))
");
$stmt->execute([
    $tripId, $relPath, $thumbRel, $largeRel, $caption, $takenAt,
    $gps['lat'] ?? null, $gps['lng'] ?? null,
    $width, $height, $tripId,
]);

Response::json([
    'id'        => (int)$db->lastInsertId(),
    'path'      => $relPath,
    'thumb'     => $thumbRel,
    'large'     => $largeRel,
    'taken_at'  => $takenAt,
    'gps'       => $gps,
    'width'     => $width,
    'height'    => $height,
], 201);

function makeThumb($src, int $w, int $h, int $maxSize, string $dest): bool
{
    if ($w <= $maxSize && $h <= $maxSize) {
        // Original ist klein genug, einfach JPEG kopieren
        imagejpeg($src, $dest, 88);
        return true;
    }
    $ratio = min($maxSize / $w, $maxSize / $h);
    $nw = (int)($w * $ratio);
    $nh = (int)($h * $ratio);
    $thumb = imagecreatetruecolor($nw, $nh);
    imagecopyresampled($thumb, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
    imagejpeg($thumb, $dest, 88);
    imagedestroy($thumb);
    return true;
}

function exifToDecimal(array $coord, string $hemi): float
{
    $d = evalFraction($coord[0]);
    $m = evalFraction($coord[1]) / 60;
    $s = evalFraction($coord[2]) / 3600;
    $val = $d + $m + $s;
    return ($hemi === 'S' || $hemi === 'W') ? -$val : $val;
}

function evalFraction(string $f): float
{
    [$n, $d] = array_pad(explode('/', $f), 2, 1);
    return $d == 0 ? 0.0 : (float)$n / (float)$d;
}
