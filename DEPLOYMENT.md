# RaftLog Deployment-Anleitung — all-inkl.com

> Stand: 2026-05-20. Wenn etwas hakt, hier nachlesen und ggf. korrigieren.

---

## Vorbereitung lokal

### 1. Production-Build erstellen

```bash
cd /Users/Jochen/Sites/localhost/RaftLog/frontend
npm install            # falls noch nicht geschehen
npm run build          # erzeugt /public/ mit allen Assets + sw.js
```

Ergebnis im Ordner `public/`:
```
public/
├─ index.html
├─ assets/
│  ├─ index-XXXXX.js
│  └─ index-XXXXX.css
├─ favicon.svg
├─ icon.svg
├─ manifest.webmanifest
├─ sw.js
└─ workbox-XXXXX.js
```

### 2. Lokale `config.php` NICHT hochladen!
Die lokale `config/config.php` hat deine Dev-Werte. Für Produktion legst du eine NEUE `config.php` direkt auf dem Server an (Schritt 7 unten).

---

## all-inkl: KAS-Einstellungen

### 3. Subdomain oder Domain anlegen
Im KAS unter **Domains → Subdomain anlegen** (oder neue Domain).
Zum Beispiel: `raftlog.b-prisma.de`.

**Wichtig: Document-Root** = das spätere Upload-Verzeichnis, z.B. `/raftlog/`.
*Nicht* auf `/raftlog/public/` zeigen lassen — der Document-Root muss auf den **RaftLog-Root** zeigen, damit `/api/`, `/uploads/`, `/setup/` erreichbar sind. Die `.htaccess` reicht Frontend-Requests transparent nach `public/` durch.

### 4. PHP-Version einstellen
KAS → **Tools → PHP-Einstellungen → für die Subdomain → PHP 8.2** (oder höher).
Wenn du 8.3 wählst: in `.htaccess` Zeile 4 von `php82-cgi` auf `php83-cgi` ändern.

### 5. MySQL-Datenbank anlegen
KAS → **Datenbanken → Neue Datenbank anlegen**.
- Datenbankname: z.B. `dXXXXXXX_raftlog` (wird vom System vergeben)
- Passwort generieren und merken — du brauchst es für `config.php`
- Hostname notieren (meist `dXXXXXXX.kasserver.com`)

### 6. SSL-Zertifikat aktivieren (optional aber empfohlen)
KAS → **Domains → SSL-Verwaltung → Let's Encrypt aktivieren** für die Subdomain.
Dauer: 5–15 min, dann ist die Subdomain unter `https://` erreichbar.

---

## Files hochladen (FTP/SFTP)

### 7. Was hochladen — was NICHT

**Hochladen (per FileZilla/Cyberduck/o.ä. ins Document-Root der Subdomain):**

```
.htaccess
api/                 ← komplett
lib/                 ← komplett
config/
└─ .htaccess         ← der Schutz vor direktem Zugriff
database/
└─ schema.sql        ← nur einmal zum Import nötig, danach kann's bleiben oder weg
public/              ← komplett (das ist die gebaute App)
setup/               ← nur TEMPORÄR für Admin-Anlage, danach LÖSCHEN
uploads/
├─ .htaccess
├─ trips/.gitkeep
└─ tracks/.gitkeep
```

**NICHT hochladen:**
- `frontend/` — Vite-Quellcode, riesig, nicht produktionsrelevant
- `mockups/` — nur Designvorschau
- `node_modules/` — gigantisch, gehört nie auf den Server
- `.git/` — Git-Metadaten
- `PLAN.md`, `DESIGN.md`, `SESSION_STATUS.md`, `DEPLOYMENT.md` — nur Dokumentation für dich
- Deine lokale `config/config.php` — siehe Schritt 8
- `package-lock.json`, `package.json` — gehören zum Frontend

**Tipp Filezilla-Filter**: rechts → Filter → "Hidden files" anzeigen, sonst werden `.htaccess`-Dateien übersehen!

### 8. `config/config.php` direkt auf dem Server anlegen

Erstelle im KAS-Datei-Manager oder per FTP eine **neue** Datei `config/config.php`:

```php
<?php
return [
    // Datenbank — Werte aus KAS Schritt 5
    'db_host'      => 'dXXXXXXX.kasserver.com',
    'db_name'      => 'dXXXXXXX_raftlog',
    'db_user'      => 'dXXXXXXX_raftlog',
    'db_pass'      => 'DEIN_GENERIERTES_PASSWORT',

    // Mapy.cz-Key (kostenlos auf https://developer.mapy.cz registrieren)
    'mapy_key'     => 'DEIN_MAPY_KEY_ODER_LEER',

    'app_name'     => 'RaftLog',
    'app_url'      => 'https://raftlog.b-prisma.de',
    'debug'        => false,

    'upload_dir'   => __DIR__ . '/../uploads',
    'upload_url'   => '/uploads',
    'max_upload_mb'=> 12,

    // CORS — NUR die eigene Produktions-Domain
    'allowed_origins' => [
        'https://raftlog.b-prisma.de',
    ],

    'session_name' => 'rl_session',
];
```

### 9. Verzeichnisrechte

Sicherstellen, dass `uploads/` und seine Unterverzeichnisse **beschreibbar** sind. Bei all-inkl normalerweise automatisch OK (Owner: dein FTP-User). Falls nicht:

```
chmod 755 uploads/
chmod 755 uploads/trips/
chmod 755 uploads/tracks/
```

Im FTP-Client per Rechtsklick → Dateieigenschaften → Rechte 755.

---

## Datenbank-Schema importieren

### 10. Schema einspielen via phpMyAdmin

1. KAS → Datenbanken → **phpMyAdmin öffnen** für die neue DB
2. Reiter **Importieren**
3. `database/schema.sql` hochladen
4. Auf **OK** klicken → 11 Tabellen werden angelegt

Test: Im Reiter **Struktur** musst du sehen:
`users, rivers, lakes, caves, portages, trips, trip_team, trip_gear, trip_hazards, trip_tracks, photos`.

---

## Admin anlegen

### 11. Setup-Script aufrufen

Im Browser öffnen: `https://raftlog.b-prisma.de/setup/create-admin.php`

Formular ausfüllen:
- Name: dein Name
- Handle: z.B. `jochen` (nur Buchstaben/Zahlen)
- E-Mail: deine E-Mail
- Passwort: min. 8 Zeichen

→ Klick auf **Admin anlegen**.

### 12. ⚠️ Setup-Verzeichnis löschen!
**Sofort danach** im FTP/KAS-Datei-Manager den kompletten Ordner `setup/` löschen.
Sonst kann jeder den ersten Admin überschreiben.

---

## HTTPS aktivieren

### 13. HTTPS-Redirect in `.htaccess` einkommentieren

Sobald SSL aktiv ist (siehe Schritt 6), in `.htaccess` die Zeilen 9–10 entkommentieren:

```apache
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Testen

### 14. Aufrufen und einloggen

`https://raftlog.b-prisma.de/`

→ Login-Screen erscheint mit Wasser-Logo
→ Mit der in Schritt 11 angelegten E-Mail + Passwort einloggen
→ Feed zeigt "Noch keine Befahrungen — Lege deine erste Befahrung an"

### 15. Erste Befahrung anlegen

1. Klick aufs **+** (Bottom-Nav-FAB oder Sidebar-Button)
2. Schritt 1: **Fluss** auswählen → Weiter
3. Schritt 2: **+ Neuen Eintrag anlegen** → "Aller" eingeben, Region "Niedersachsen" → Anlegen, dann auswählen
4. Titel eintragen, weiter
5. Datum, Strecke, Schwierigkeit
6. (Optional) Notizen, Team, Fotos hochladen
7. **Speichern** → Detail-Ansicht öffnet sich

### 16. Fotos testen
- Im Detail → Tab **Fotos** → "Fotos hochladen"
- Mehrere Bilder gleichzeitig wählen
- Beobachtung: Fortschritt zeigt "Lade X/Y…", 3 parallel
- Nach Upload erscheinen Thumbnails. Bilder mit EXIF-GPS bekommen ein "GPS"-Badge

### 17. Falls etwas nicht geht

| Symptom | Vermutliche Ursache | Fix |
|---------|---------------------|-----|
| Weiße Seite, F12 zeigt 404 auf /assets/ | DocumentRoot zeigt auf `public/` statt RaftLog-Root | Document-Root in KAS korrigieren |
| 500 Server Error | PHP-Version falsch, oder `config.php` fehlt/falsch | KAS PHP-Version prüfen; `config/config.php` checken |
| "Nicht angemeldet" trotz Login | Session-Cookies werden nicht gesetzt | Sicherstellen, dass HTTPS für Subdomain aktiv ist |
| API liefert HTML statt JSON | `.htaccess` greift nicht | mod_rewrite aktiv? Bei all-inkl Standard, falls nicht: KAS-Support |
| Foto-Upload "Datei-Upload fehlgeschlagen" | `uploads/` nicht beschreibbar | chmod 755 setzen |
| CORS-Fehler im Browser | `allowed_origins` in `config.php` enthält die Domain nicht | dort eintragen und genau die Schreibweise (https://… inkl. Subdomain) |

---

## Update später (Code-Änderungen ausspielen)

Wenn du am Frontend etwas änderst:

```bash
cd frontend
npm run build
```

Dann den Inhalt von `public/` per FTP **komplett ersetzen** auf dem Server.

Wenn du am Backend etwas änderst:
- Geänderte Dateien aus `api/` oder `lib/` einzeln per FTP hochladen
- DB-Schema-Änderungen separat als ALTER-Statements via phpMyAdmin einspielen

---

## Checkliste auf einen Blick

- [ ] `npm run build` lokal ausgeführt
- [ ] Subdomain im KAS angelegt, Document-Root auf RaftLog-Root
- [ ] PHP 8.2 aktiviert
- [ ] MySQL-DB angelegt, Zugangsdaten notiert
- [ ] SSL-Zertifikat eingerichtet
- [ ] Files hochgeladen (api/ lib/ config/ database/ public/ setup/ uploads/ .htaccess)
- [ ] `config/config.php` mit echten Werten erstellt
- [ ] `uploads/` chmod 755
- [ ] `schema.sql` via phpMyAdmin importiert (11 Tabellen)
- [ ] `setup/create-admin.php` aufgerufen, Admin angelegt
- [ ] **`setup/` Ordner gelöscht**
- [ ] HTTPS-Redirect in `.htaccess` einkommentiert
- [ ] Login funktioniert, Feed lädt
- [ ] Erste Befahrung angelegt
- [ ] Foto-Upload funktioniert
