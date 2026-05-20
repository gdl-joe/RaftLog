<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/Database.php';

$cfgFile = __DIR__ . '/../config/config.php';
if (!file_exists($cfgFile)) {
    die("config.php fehlt — bitte zuerst config.example.php nach config.php kopieren und anpassen.\n");
}

$db = Database::get();

$msg = '';
$err = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name   = trim($_POST['name']   ?? '');
    $handle = trim($_POST['handle'] ?? '');
    $email  = trim($_POST['email']  ?? '');
    $pass   = $_POST['password']    ?? '';

    if (!$name || !$handle || !$email || !$pass) {
        $err = 'Alle Felder ausfüllen.';
    } elseif (strlen($pass) < 8) {
        $err = 'Passwort mindestens 8 Zeichen.';
    } else {
        try {
            $exists = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
            if ($exists > 0) {
                $err = 'Es existiert bereits mindestens ein Benutzer. Setup ist nur einmal möglich. Lösche das setup/-Verzeichnis!';
            } else {
                $db->prepare("INSERT INTO users (handle, name, email, password_hash, role) VALUES (?,?,?,?, 'admin')")
                   ->execute([$handle, $name, $email, password_hash($pass, PASSWORD_BCRYPT)]);
                $msg = "Admin angelegt. Bitte das setup/-Verzeichnis jetzt löschen!";
            }
        } catch (\Throwable $e) {
            $err = 'Fehler: ' . $e->getMessage();
        }
    }
}
?>
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>RaftLog — Setup</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #0e1820; color: #e6eef4; padding: 40px; max-width: 480px; margin: 0 auto; }
  h1 { color: #14b8a6; }
  label { display: block; margin: 14px 0 4px; color: #93a4b1; font-size: 14px; }
  input { width: 100%; padding: 10px 12px; background: #15212a; border: 1px solid #2a3a47; border-radius: 8px; color: #e6eef4; font-size: 16px; }
  button { margin-top: 22px; padding: 12px 24px; background: #14b8a6; color: #fff; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
  .msg { padding: 14px; background: rgba(34,197,94,.15); border: 1px solid #22c55e; border-radius: 10px; margin: 18px 0; }
  .err { padding: 14px; background: rgba(239,68,68,.15); border: 1px solid #ef4444; border-radius: 10px; margin: 18px 0; }
  .warn { background: rgba(245,158,11,.1); border-left: 3px solid #f59e0b; padding: 12px; margin: 18px 0; font-size: 14px; }
</style>
</head>
<body>
<h1>RaftLog Setup</h1>
<p>Diese Seite legt den ersten Administrator an.</p>

<div class="warn">⚠️ Nach erfolgreichem Anlegen <strong>das setup/-Verzeichnis sofort löschen!</strong></div>

<?php if ($msg): ?><div class="msg"><?= htmlspecialchars($msg) ?></div><?php endif; ?>
<?php if ($err): ?><div class="err"><?= htmlspecialchars($err) ?></div><?php endif; ?>

<form method="post">
  <label>Name</label><input name="name" required>
  <label>Handle (Username, ohne Sonderzeichen)</label><input name="handle" required pattern="[a-zA-Z0-9_-]+">
  <label>E-Mail</label><input name="email" type="email" required>
  <label>Passwort (min. 8 Zeichen)</label><input name="password" type="password" required minlength="8">
  <button type="submit">Admin anlegen</button>
</form>

</body>
</html>
