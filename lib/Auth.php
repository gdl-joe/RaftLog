<?php
declare(strict_types=1);

class Auth
{
    private static ?array $user = null;

    public static function start(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_set_cookie_params([
                'lifetime' => 0,
                'path'     => '/',
                'secure'   => isset($_SERVER['HTTPS']),
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
            session_name('rl_session');
            session_start();
        }
    }

    public static function user(): ?array
    {
        if (self::$user !== null) return self::$user;
        Auth::start();
        if (empty($_SESSION['user_id'])) return null;
        $db = Database::get();
        $stmt = $db->prepare('SELECT id, handle, name, email, role, prefs FROM users WHERE id = ?');
        $stmt->execute([$_SESSION['user_id']]);
        self::$user = $stmt->fetch() ?: null;
        if (self::$user && self::$user['prefs']) {
            self::$user['prefs'] = json_decode(self::$user['prefs'], true);
        }
        return self::$user;
    }

    public static function require(): array
    {
        $u = self::user();
        if (!$u) {
            http_response_code(401);
            echo json_encode(['error' => 'Nicht angemeldet']);
            exit;
        }
        return $u;
    }

    public static function requireAdmin(): array
    {
        $u = self::require();
        if ($u['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Keine Berechtigung']);
            exit;
        }
        return $u;
    }

    public static function login(string $email, string $password): bool
    {
        Auth::start();
        $db = Database::get();
        $stmt = $db->prepare('SELECT id, password_hash FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        if (!$row || !password_verify($password, $row['password_hash'])) return false;
        session_regenerate_id(true);
        $_SESSION['user_id'] = $row['id'];
        $db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')->execute([$row['id']]);
        self::$user = null;
        return true;
    }

    public static function logout(): void
    {
        Auth::start();
        $_SESSION = [];
        session_destroy();
        self::$user = null;
    }

    public static function csrf(): string
    {
        Auth::start();
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf'];
    }

    public static function verifyCsrf(): void
    {
        Auth::start();
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? '');
        if (!hash_equals($_SESSION['csrf'] ?? '', $token)) {
            http_response_code(403);
            echo json_encode(['error' => 'CSRF-Token ungültig']);
            exit;
        }
    }
}
