<?php
require_once __DIR__ . '/bootstrap.php';

$path  = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_values(array_filter(explode('/', $path)));

$apiPos = array_search('api', $parts);
$endpoint = $parts[$apiPos + 1] ?? '';

$endpoints = [
    'auth'     => __DIR__ . '/auth.php',
    'trips'    => __DIR__ . '/trips.php',
    'waters'   => __DIR__ . '/waters.php',
    'rivers'   => __DIR__ . '/rivers.php',
    'lakes'    => __DIR__ . '/lakes.php',
    'caves'    => __DIR__ . '/caves.php',
    'portages' => __DIR__ . '/portages.php',
    'tracks'   => __DIR__ . '/tracks.php',
    'photos'   => __DIR__ . '/photos.php',
    'upload'   => __DIR__ . '/upload.php',
    'stats'    => __DIR__ . '/stats.php',
    'users'    => __DIR__ . '/users.php',
];

if (isset($endpoints[$endpoint])) {
    require $endpoints[$endpoint];
} else {
    Response::notFound("Unbekannter Endpunkt: $endpoint");
}
