<?php
require_once __DIR__ . '/bootstrap.php';

// /api/waters?type=river|lake|cave|portage  → delegiert an die typ-spezifische API
$type = $_GET['type'] ?? '';
$map = [
    'river'   => __DIR__ . '/rivers.php',
    'lake'    => __DIR__ . '/lakes.php',
    'cave'    => __DIR__ . '/caves.php',
    'portage' => __DIR__ . '/portages.php',
];
if (!isset($map[$type])) Response::error('Unbekannter type: ' . $type);
require $map[$type];
