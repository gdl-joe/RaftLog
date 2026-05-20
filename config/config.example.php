<?php
// RaftLog Config — diese Datei nach config.php kopieren und Werte eintragen.
// Niemals in Git committen!

return [
    'db_host'      => $_ENV['DB_HOST'] ?? 'localhost',
    'db_name'      => $_ENV['DB_NAME'] ?? 'raftlog',
    'db_user'      => $_ENV['DB_USER'] ?? 'root',
    'db_pass'      => $_ENV['DB_PASS'] ?? '',

    'mapy_key'     => $_ENV['MAPY_API_KEY'] ?? '',

    'app_name'     => 'RaftLog',
    'app_url'      => $_ENV['APP_URL'] ?? 'http://raftlog.test',
    'debug'        => ($_ENV['APP_DEBUG'] ?? 'false') === 'true',

    'upload_dir'   => __DIR__ . '/../uploads',
    'upload_url'   => '/uploads',
    'max_upload_mb'=> 12,
    'allowed_origins' => [
        'http://localhost:5173',   // Vite Dev-Server
        'http://raftlog.test',     // Herd
        'https://raftlog.test',
    ],

    'session_name' => 'rl_session',
];
