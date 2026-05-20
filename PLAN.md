# RaftLog — Implementierungsplan

> Mobile PWA zum Loggen von Packraft-Befahrungen auf Flüssen, Seen, in Höhlen und mit Portage-Abschnitten.
> Vorbild **CaveLog** (Vite + React + PHP/MySQL), Datenmodell erweitert um wassersportspezifische Felder.

---

## 1. Stack & Architektur

| Schicht        | Technologie                                       | Quelle |
|----------------|---------------------------------------------------|--------|
| Frontend       | Vite + React, PWA (Service Worker, Manifest)      | CaveLog |
| Karten         | mapy.cz Tiles (eigener API-Key, kostenlos)         | CaveLog/Camperstop |
| GPX            | Eigener Parser im Frontend (kein NPM-Package nötig)| neu |
| Backend        | PHP 8.2, eigene `lib/` (Auth, Database, Response)  | CaveLog |
| DB             | MySQL 8.0, utf8mb4_unicode_ci                      | CaveLog |
| Auth           | Session-Tokens in DB, admin/viewer-Rollen          | CaveLog |
| Foto-Upload    | GD-Resize, Thumbnail (400px) + Large (1200px)      | CaveLog |
| Hosting        | Herd lokal → all-inkl.com produktiv                | Standard |

---

## 2. Verzeichnisstruktur

```
RaftLog/
├─ PLAN.md
├─ SESSION_STATUS.md
├─ .htaccess                 ← PHP 8.2, optional HTTPS-Redirect
├─ api/
│  ├─ index.php              ← Router
│  ├─ bootstrap.php
│  ├─ auth.php
│  ├─ trips.php
│  ├─ waters.php             ← polymorph: rivers/lakes/caves/portages
│  ├─ rivers.php
│  ├─ lakes.php
│  ├─ caves.php
│  ├─ portages.php
│  ├─ tracks.php             ← GPX-Upload/Download
│  ├─ photos.php
│  ├─ upload.php
│  ├─ stats.php
│  └─ users.php
├─ lib/
│  ├─ Auth.php
│  ├─ Database.php
│  ├─ Response.php
│  └─ GpxParser.php          ← neu
├─ config/
│  ├─ config.example.php
│  └─ config.php             ← .gitignore
├─ database/
│  └─ schema.sql
├─ uploads/                  ← Fotos + GPX-Files
│  ├─ trips/
│  ├─ tracks/
│  └─ .htaccess              ← PHP-Ausführung verboten
├─ setup/
│  └─ create-admin.php       ← nach Setup löschen!
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ index.html
│  └─ src/
│     ├─ main.jsx
│     ├─ App.jsx
│     ├─ api.js
│     ├─ theme.js
│     ├─ icons.jsx
│     ├─ atoms.jsx
│     ├─ index.css
│     ├─ data.js
│     ├─ components/
│     │  ├─ MapyMap.jsx
│     │  ├─ PhotoLightbox.jsx
│     │  ├─ GpxTrackLayer.jsx
│     │  ├─ TripTypePicker.jsx
│     │  └─ DifficultyBars.jsx
│     └─ screens/
│        ├─ LoginScreen.jsx
│        ├─ FeedScreen.jsx
│        ├─ NewScreen.jsx
│        ├─ DetailScreen.jsx
│        ├─ EditTripScreen.jsx
│        ├─ MapScreen.jsx
│        ├─ WatersScreen.jsx
│        ├─ StatsScreen.jsx
│        └─ ProfileScreen.jsx
└─ public/                   ← Build-Ziel (vite build → ../public)
   ├─ manifest.webmanifest
   ├─ sw.js
   ├─ icon.svg
   └─ index.html             ← generiert
```

---

## 3. Datenbankschema (Kern)

### Stammdaten

```sql
users           -- wie CaveLog (id, handle, name, email, role, prefs, invite_token, …)
sessions        -- wie CaveLog (id, user_id, expires_at, …)

rivers (
  id VARCHAR(64) PK,
  name VARCHAR(180), country CHAR(2), region VARCHAR(180),
  source_name VARCHAR(180),   source_lat DECIMAL(9,6), source_lng DECIMAL(9,6),
  mouth_name VARCHAR(180),    mouth_lat DECIMAL(9,6),  mouth_lng DECIMAL(9,6),
  length_km DECIMAL(7,2),
  ww_grade_typical VARCHAR(16),  -- z.B. "II–III"
  notes TEXT, created_by, created_at, updated_at
)

lakes (
  id VARCHAR(64) PK,
  name VARCHAR(180), country CHAR(2), region VARCHAR(180),
  lat DECIMAL(9,6), lng DECIMAL(9,6),
  area_km2 DECIMAL(8,2),
  depth_max_m INT,
  notes TEXT, created_by, created_at, updated_at
)

caves           -- exakt wie CaveLog (Wiederverwendung)

portages (
  id VARCHAR(64) PK,
  name VARCHAR(180), country CHAR(2), region VARCHAR(180),
  start_lat DECIMAL(9,6), start_lng DECIMAL(9,6),
  end_lat   DECIMAL(9,6), end_lng   DECIMAL(9,6),
  distance_m INT, elevation_gain_m INT,
  notes TEXT, created_by, created_at, updated_at
)
```

### Befahrungen

```sql
trips (
  id VARCHAR(64) PK,                       -- t-2026-05-19-aller
  trip_type ENUM('river','lake','cave','portage') NOT NULL,
  water_id VARCHAR(64) NOT NULL,           -- FK je nach trip_type (App-seitig validiert)
  title VARCHAR(240) NOT NULL,
  date_from DATE NOT NULL,
  date_to   DATE NULL,                     -- NULL = Eintages-Trip
  start_time TIME, end_time TIME,
  duration_min INT UNSIGNED,

  -- Einheitlich:
  diff_t TINYINT UNSIGNED,  -- Technisch 1–5
  diff_k TINYINT UNSIGNED,  -- Körperlich 1–5
  diff_p TINYINT UNSIGNED,  -- Psychisch 1–5
  rating TINYINT UNSIGNED,  -- Gesamt 1–5

  -- Allgemein:
  distance_km DECIMAL(6,2),       -- gefahrene/getragene Strecke
  weather VARCHAR(240),
  notes TEXT,

  -- Typ-spezifische Felder (alle NULLable, App zeigt nur passende):
  --   river:
  ww_grade   VARCHAR(16),         -- "WW II", "WW III–IV", "X"
  water_level VARCHAR(80),        -- Freitext, z.B. "Pegel 120 cm, niedrig"
  put_in_lat DECIMAL(9,6),  put_in_lng DECIMAL(9,6),
  take_out_lat DECIMAL(9,6), take_out_lng DECIMAL(9,6),
  --   lake:
  wind_beaufort TINYINT UNSIGNED,
  waves VARCHAR(80),              -- "glatt", "kurze Wellen", "Schwell"
  --   cave (Höhle):
  wet     ENUM('Trocken','Teilweise','Nass'),
  rope    ENUM('Ohne','Mit Seil','SRT'),
  --   portage:
  portage_distance_m INT UNSIGNED,
  carry_method VARCHAR(80),       -- "Rollen", "Schultern", "Schleppen"

  hero_icon ENUM('river','lake','cave','portage','mixed') DEFAULT 'river',
  is_public TINYINT(1) DEFAULT 0,
  created_by INT, created_at, updated_at,
  INDEX (date_from), INDEX (trip_type), INDEX (water_id), INDEX (created_by)
)

trip_team       -- wie CaveLog
trip_gear       -- wie CaveLog (freie Tags)
trip_hazards    -- wie CaveLog

trip_tracks (
  id INT AUTO_INCREMENT PK,
  trip_id VARCHAR(64) NOT NULL,
  source ENUM('gpx_import','live') NOT NULL,
  gpx_path VARCHAR(500),                  -- original GPX-Datei
  points_json LONGTEXT,                   -- vereinfachte Liste [{lat,lng,t,ele}] für Anzeige
  point_count INT UNSIGNED,
  distance_km DECIMAL(6,2),
  duration_s INT UNSIGNED,
  ele_gain_m INT,
  bbox_n DECIMAL(9,6), bbox_s DECIMAL(9,6),
  bbox_e DECIMAL(9,6), bbox_w DECIMAL(9,6),
  created_at DATETIME,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
)

photos          -- wie CaveLog (mit gps_lat/lng aus EXIF, thumb_path, large_path)
```

### Statistik-Views (optional, performance)

```sql
v_trip_yearly_km — SUM(distance_km) GROUP BY YEAR, trip_type
v_top_waters     — COUNT(*) GROUP BY trip_type, water_id ORDER BY cnt DESC
```

---

## 4. API-Endpoints

| Methode | URL                          | Zweck |
|---------|------------------------------|-------|
| POST    | `/api/auth/login`            | Login |
| POST    | `/api/auth/logout`           | Logout |
| GET     | `/api/auth/me`               | Aktueller User |
| GET     | `/api/trips`                 | Feed mit Filter `?type=river&year=2026&water_id=…` |
| GET     | `/api/trips?id=…`            | Einzeltrip |
| POST    | `/api/trips`                 | Neuen Trip anlegen |
| PUT     | `/api/trips?id=…`            | Trip ändern (admin) |
| DELETE  | `/api/trips?id=…`            | Trip löschen (admin) |
| GET     | `/api/waters?type=river`     | Liste je Typ (rivers/lakes/caves/portages) |
| POST    | `/api/waters?type=river`     | Neues Gewässer/Ort anlegen |
| GET     | `/api/tracks?trip_id=…`      | Tracks zum Trip |
| POST    | `/api/tracks`                | GPX-Upload (multipart) |
| DELETE  | `/api/tracks?id=…`           | Track löschen |
| GET     | `/api/photos?trip_id=…`      | Fotos zum Trip |
| POST    | `/api/upload`                | Foto-Upload (multipart) |
| DELETE  | `/api/photos?id=…`           | Foto löschen |
| GET     | `/api/stats`                 | Aggregierte Stats (km, Top-Waters, Histogramme, Heatmap) |
| GET     | `/api/users`                 | Userliste (admin) |
| POST    | `/api/users/invite`          | Magic-Link einladen (admin) |

---

## 5. Screens & Navigation

### Bottom-Nav (5 Tabs)
**Feed** · **Karte** · **+** (New) · **Gewässer** · **Profil**

### Screen-Liste

| Screen           | Inhalt | Besonderheit |
|------------------|--------|--------------|
| **LoginScreen**  | Login + Magic-Link-Annahme | Wie CaveLog |
| **FeedScreen**   | Chronologische Trip-Liste mit Filter-Chips (Alle/Fluss/See/Höhle/Portage) und Layout-Switch (Cards/Timeline/Compact) | Wie CaveLog, Filter erweitert |
| **NewScreen**    | Wizard, Schritt 1 = Typ-Auswahl (4 große Kacheln Fluss/See/Höhle/Portage), Schritt 2 = typ-spezifische Felder | NEU: Typ-Picker |
| **DetailScreen** | Tabs: **Übersicht** / **Karte+Track** / **Fotos** / **Team & Ausrüstung** | Karten-Tab zeigt GPX-Track + Ein-/Ausstieg-Marker |
| **EditTripScreen**| Bearbeiten (admin) | Wie CaveLog |
| **MapScreen**    | Alle Trips als Marker + alle Tracks als Polylinien auf mapy.cz | Filter nach Jahr/Typ |
| **WatersScreen** | 4 Tabs: Flüsse / Seen / Höhlen / Portagen — pro Eintrag Anzahl Befahrungen | NEU |
| **StatsScreen**  | km/Jahr (Balken), Top-Gewässer (Liste), Schwierigkeits-Histogramm (T/K/P), Aktivitäts-Heatmap (Jahres-Kalender) | NEU: 4 Sektionen |
| **ProfileScreen**| Profil, Theme, Layout-Pref, Logout, ggf. Userverwaltung (admin) | Wie CaveLog |

### Live-Tracking-Modus (NEU)
- Im NewScreen Schritt 2 ein Button **"Tour jetzt starten (Live-Tracking)"**
- `navigator.geolocation.watchPosition` sammelt Punkte in `useRef`-Array
- Bei Trip-Speicherung → POST `/api/tracks` mit `source=live`
- Wake-Lock-API um Bildschirm wach zu halten (`navigator.wakeLock`)
- Warnhinweis bei Start: "Akku-intensiv"

---

## 6. Build- & Deploy-Strategie

### Lokal (Herd)
```bash
cd frontend && npm install && npm run dev    # Vite-Dev-Server auf :5173
# API erreichbar unter http://raftlog.test/api/…
# Frontend proxy: /api → raftlog.test/api/  (vite.config.js)
```

### Produktion
```bash
cd frontend && npm run build                 # → ../public/
# Upload nach all-inkl ~/html/raftlog/:
#   public/* → html/raftlog/
#   api/, lib/, config/, uploads/, setup/, .htaccess
# Schema importieren via phpMyAdmin
# /setup/create-admin.php aufrufen, dann setup/ löschen
```

---

## 7. Implementierungs-Reihenfolge (Schritte)

1. **Design-Mockup** via `ui-ux-pro-max` Skill — Farbpalette, Tokens, 3 Key-Screens (Feed, Detail, New)
2. **Verzeichnis-Setup** — Struktur aus CaveLog kopieren und umbenennen
3. **Backend-Schema** — `database/schema.sql` schreiben + importieren
4. **Lib + Bootstrap** — `lib/Auth.php`, `Database.php`, `Response.php`, `GpxParser.php`
5. **Auth-API** — `auth.php`, `users.php`, `setup/create-admin.php`
6. **Waters-API** — `rivers.php`, `lakes.php`, `caves.php`, `portages.php` (CRUD)
7. **Trips-API** — `trips.php` mit allen typ-spezifischen Feldern
8. **Tracks-API** — `tracks.php` mit GPX-Parser
9. **Photos-API** — `upload.php`, `photos.php` (übernehmen aus CaveLog)
10. **Frontend-Gerüst** — Vite-Projekt, `App.jsx`, `api.js`, Router, Login
11. **FeedScreen + DetailScreen** mit API-Wiring
12. **NewScreen-Wizard** mit Trip-Typ-Picker und typ-spezifischen Formularen
13. **MapScreen + WatersScreen** mit mapy.cz
14. **GPX-Import + Live-Tracking** in NewScreen
15. **StatsScreen** mit allen 4 Sektionen
16. **PWA** — Manifest, Service Worker, Icons, Offline-Caching
17. **Deploy-Test** lokal, Checkliste für all-inkl
18. **SESSION_STATUS.md**

---

## 8. Foto-Galerie-Strategie

| Punkt | Lösung |
|-------|--------|
| Auswahl | `<input type="file" multiple accept="image/*">` — beliebig viele Dateien |
| Drag & Drop | Drop ins Upload-Tile sowie page-weite Drop-Zone (geplant) |
| Upload-Verfahren | **Parallel mit 3 Workers** über `uploadPhotosParallel(tripId, files, { concurrency: 3 })` in `api.js` |
| Resize | Server: GD → Thumb 400px + Large 1200px + Original |
| EXIF | Server-seitig: `taken_at`, `gps_lat`/`gps_lng` aus EXIF |
| Sortierung | Default nach `taken_at`, Fallback Upload-Reihenfolge |
| Grid-Performance | `loading="lazy"` auf allen Thumbnails |
| Vollbild | `PhotoLightbox`-Komponente (Swipe-frei, Tasten ← → ESC) |
| Limit | Pro Trip technisch unbegrenzt; Server `max_upload_mb=12` pro Foto |

## 9. Offene Punkte / Spätere Versionen

- Drag & Drop page-weite Drop-Zone für Fotos
- Karten-Layer-Switcher (Outdoor / Satellit / Verkehr)
- Offline-Queue für neue Trips (IndexedDB)
- Pegel-Integration via pegelonline.wsv.de API (DE-Flüsse) — bewusst zurückgestellt
- Live-Tracking-UI im NewScreen (Backend ist fertig: POST `/api/tracks` mit `source=live`)
- Mehr-Sprachigkeit (DE/EN)
- Export Trip als PDF/Markdown-Report
- Foto-Caption inline editieren
- Foto sortieren per Drag

---

## 9. Lizenzen & Drittquellen

- **mapy.cz** — kostenloser API-Key, Attributierung im Karten-Footer
- **Inter / JetBrains Mono** — selbst hosten (wie gdlschmiede.de)
- **GPX-Parser** — eigene Implementation, keine NPM-Abhängigkeit
