<?php
require_once __DIR__ . '/bootstrap.php';

// Harte Limits: bei großen Bildern nicht durchhängen
@set_time_limit(60);
@ini_set('memory_limit', '256M');

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
if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    $msg = $file ? match($file['error']) {
        UPLOAD_ERR_INI_SIZE  => 'Datei zu groß (PHP-Limit)',
        UPLOAD_ERR_PARTIAL   => 'Upload abgebrochen',
        UPLOAD_ERR_NO_FILE   => 'Keine Datei',
        default              => 'Upload-Fehler Code ' . $file['error'],
    } : 'Keine Datei empfangen';
    Response::error($msg);
}

$allowedMime = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
if (!in_array($mime, $allowedMime, true)) Response::error('Nicht unterstütztes Format: ' . $mime);

$maxBytes = $cfg['max_upload_mb'] * 1024 * 1024;
if ($file['size'] > $maxBytes) Response::error("Maximale Dateigröße: {$cfg['max_upload_mb']} MB");

// HEIC/HEIF braucht Imagick — wenn nicht verfügbar, abweisen mit Hinweis
$isHeic = in_array($mime, ['image/heic', 'image/heif'], true);
if ($isHeic && !extension_loaded('imagick')) {
    Response::error('HEIC/HEIF wird vom Server nicht unterstützt. Bitte das Foto vor dem Upload als JPEG exportieren (am iPhone: Einstellungen → Kamera → Formate → Maximale Kompatibilität).');
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$ext = match (true) {
    $mime === 'image/png'  => 'png',
    $mime === 'image/webp' => 'webp',
    default => 'jpg',
};
$name = bin2hex(random_bytes(8)) . '.' . $ext;
$dest = $uploadDir . $name;

if (!move_uploaded_file($file['tmp_name'], $dest)) Response::error('Speichern fehlgeschlagen', 500);

// HEIC → JPEG konvertieren via Imagick (Original wird ersetzt)
if ($isHeic) {
    try {
        $im = new Imagick($dest);
        $im->setImageFormat('jpeg');
        $im->setImageCompressionQuality(90);
        $jpgDest = preg_replace('/\.\w+$/', '.jpg', $dest);
        $im->writeImage($jpgDest);
        $im->clear();
        @unlink($dest);
        $dest = $jpgDest;
        $name = basename($dest);
        $ext  = 'jpg';
        $mime = 'image/jpeg';
    } catch (\Throwable $e) {
        @unlink($dest);
        Response::error('HEIC-Konvertierung fehlgeschlagen: ' . $e->getMessage());
    }
}

$thumbPath = $uploadDir . 'thumb_' . $name;
$largePath = $uploadDir . 'large_' . $name;
$relPath   = '/uploads/trips/' . basename($uploadDir) . '/' . $name;
$thumbRel  = null;
$largeRel  = null;
$width = $height = null;

// Resize-Versuch — wenn was schiefgeht, nutzen wir das Original als Thumb/Large
$resizeOk = false;
if (extension_loaded('gd')) {
    @ini_set('memory_limit', '256M');
    $src = match ($mime) {
        'image/jpeg' => @imagecreatefromjpeg($dest),
        'image/png'  => @imagecreatefrompng($dest),
        'image/webp' => @imagecreatefromwebp($dest),
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
        $resizeOk = true;
    }
}

// Fallback: Original-Datei als Thumb und Large verwenden, damit immer was angezeigt wird
if (!$thumbRel) $thumbRel = $relPath;
if (!$largeRel) $largeRel = $relPath;

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
    try {
        if ($w <= $maxSize && $h <= $maxSize) {
            return @imagejpeg($src, $dest, 88);
        }
        $ratio = min($maxSize / $w, $maxSize / $h);
        $nw = max(1, (int)($w * $ratio));
        $nh = max(1, (int)($h * $ratio));
        $thumb = imagecreatetruecolor($nw, $nh);
        if (!$thumb) return false;
        imagecopyresampled($thumb, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        $ok = @imagejpeg($thumb, $dest, 88);
        imagedestroy($thumb);
        return (bool)$ok;
    } catch (\Throwable $e) {
        return false;
    }
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
