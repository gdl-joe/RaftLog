# Projektstand — RaftLog
Zuletzt aktualisiert: 2026-05-20

## Was wurde gemacht

### Session 1 — Konzept + Design (heute)
- Brainstorming, Vorgabe-Recherche (CaveLog, Camperstop), Trip-Typen, Schwierigkeitsmodell geklärt
- `PLAN.md` — Stack, Verzeichnis, DB-Schema, API-Endpoints, Screens, Schritt-Reihenfolge
- `DESIGN.md` — Design-Tokens, Wasser-Petrol-Palette, Component-Specs, Responsive-Strategie
- `mockups/` — gerenderte HTML-Mockups für Feed, Detail, Fotos, Neu, Gewässer mit Sandbox-Schalter (Mobile/Tablet/Desktop × Dark/Light)
- Mockups durch Jochen freigegeben

### Session 2 — Implementierung (heute)

**Backend komplett (PHP/MySQL):**
- `database/schema.sql` — 11 Tabellen (users, sessions, rivers, lakes, caves, portages, trips, trip_team, trip_gear, trip_hazards, trip_tracks, photos)
- `lib/` — Database (PDO), Auth (Sessions+CSRF), Response (JSON), GpxParser (Haversine + Vereinfachung)
- `api/` — 12 Endpoints: auth · waters (Router) · rivers · lakes · caves · portages · trips · tracks · upload · photos · stats · users
- `setup/create-admin.php` — einmaliges Setup
- `.htaccess` (Root, uploads, config), Upload-PHP-Sperre

**Frontend komplett (Vite + React + Tailwind):**
- `frontend/` — package.json, vite.config.js (PWA-Plugin, mapy.cz-Cache), tailwind+postcss
- `src/index.css` — Design-Tokens als CSS-Variablen, App-Shell-Grid (Mobile→Desktop), Component-Klassen
- `src/api.js` — Fetch-Wrapper mit CSRF, Parallel-Upload-Pool
- `src/icons.jsx` — Lucide-Style Inline-SVG-Icons
- `src/atoms.jsx` — TripCard, Chip, DiffBars, Rating, FilterChip, Loading, EmptyState
- `src/App.jsx` — Sidebar (Desktop) + Bottom-Nav (Mobile), 9 Screen-Routing
- `src/screens/` — Login, Feed, Detail (4 Tabs), New (4-Schritt-Wizard), EditTrip, Map, Waters, Stats, Profile
- `src/components/` — MapyMap (Leaflet mit mapy.cz/OSM-Fallback), PhotoLightbox

**Build-Test bestanden:** `npm run build` → 48 Module, 355 KB JS (107 KB gzip), 40 KB CSS, PWA mit Service-Worker generiert.

## Dateistruktur (Stand jetzt)

```
RaftLog/
├─ PLAN.md
├─ DESIGN.md
├─ SESSION_STATUS.md
├─ .htaccess           ← PHP 8.2, SPA-Routing, API-Routing, Schutz
├─ .gitignore
├─ api/                ← 12 PHP-Endpoints
├─ lib/                ← Auth, Database, Response, GpxParser
├─ config/
│  ├─ config.example.php
│  └─ config.php       ← lokal angelegt, NICHT committen
├─ database/
│  └─ schema.sql       ← noch zu importieren!
├─ uploads/            ← Foto-Storage (trips/, tracks/)
├─ setup/
│  └─ create-admin.php ← einmal aufrufen, dann LÖSCHEN
├─ frontend/
│  ├─ index.html
│  ├─ vite.config.js
│  ├─ tailwind.config.js
│  ├─ package.json
│  └─ src/             ← Alle Screens + Komponenten
├─ public/             ← Build-Output (vite build), auch von .htaccess als SPA-Root genutzt
└─ mockups/            ← Designvorschau (kann später gelöscht werden)
```

## Aktueller Stand — wo wir stehen

| Bereich | Status |
|---------|--------|
| Backend-API | ✅ vollständig |
| Datenbank-Schema | ✅ geschrieben, **noch nicht importiert** |
| Frontend-Code | ✅ vollständig (alle 9 Screens) |
| Build-Pipeline | ✅ läuft sauber durch (Vite + PWA) |
| `config.php` | ✅ lokal angelegt (Default localhost/root/leer) — DB-Daten eintragen! |
| Mapy.cz-Key | ❌ noch nicht eingetragen — Fallback auf OSM funktioniert |
| Admin-User | ❌ noch nicht angelegt — `/setup/create-admin.php` |
| Erste Daten | ❌ keine |
| PWA-PNG-Icons | ⚠️ aktuell SVG-Manifest. Für richtigen PWA-Install evtl. später PNG-Icons (192 + 512) erzeugen |

## Einrichtung (Checkliste — lokal mit Herd)

1. **MySQL-Datenbank anlegen** (lokal in Herd/phpMyAdmin):
   ```sql
   CREATE DATABASE raftlog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. **DB-Zugang in `config/config.php` eintragen** (DB-Name, User, Pass)
3. **Schema importieren:**
   ```bash
   mysql -u root raftlog < database/schema.sql
   ```
4. **Domain in Herd** (raftlog.test) auf `/Users/Jochen/Sites/localhost/RaftLog` zeigen
5. **Frontend-Dev-Server starten:**
   ```bash
   cd frontend && npm run dev
   # läuft auf http://localhost:5173, API-Calls werden zu raftlog.test proxiert
   ```
6. **Admin anlegen:** http://raftlog.test/setup/create-admin.php
7. **`setup/`-Verzeichnis löschen** nach Admin-Anlage
8. **Mapy.cz-Key besorgen** (kostenlos auf developer.mapy.cz) und entweder
   - in `config/config.php` unter `mapy_key` eintragen ODER
   - direkt in `frontend/index.html` als `<meta name="mapy-key" content="…">`
9. **Erste Befahrung anlegen** über `/?new=1`

## Produktion (all-inkl.com)

```bash
# 1. Frontend bauen
cd frontend && npm run build      # erzeugt ../public/

# 2. Upload nach all-inkl ~/html/raftlog/:
#    api/, lib/, config/ (mit echter config.php), uploads/, setup/, public/, .htaccess
#    NICHT hochladen: frontend/, mockups/, .git/, node_modules/

# 3. DB-Setup via phpMyAdmin: schema.sql importieren
# 4. config.php auf KAS-Werte anpassen
# 5. /setup/create-admin.php aufrufen
# 6. setup/ löschen
# 7. PHP 8.2 in KAS aktivieren
# 8. HTTPS aktivieren, dann in .htaccess die RewriteRule für HTTPS einkommentieren
# 9. CORS in config.php auf eigene Domain einschränken (allowed_origins)
```

## Nächste Schritte

### Sofort (Setup)
1. DB anlegen + Schema importieren
2. `config.php` mit Zugangsdaten füllen
3. Admin anlegen, setup/ löschen
4. Frontend starten, einloggen, ersten Trip anlegen

### Optional (später)
- Mapy.cz-Key besorgen und eintragen
- PNG-Icons 192/512 generieren (z.B. mit Online-SVG→PNG-Konverter oder Sharp-Skript)
- Live-Tracking-UI im NewScreen (Backend ist fertig)
- Drag & Drop page-weite Drop-Zone für Foto-Upload

## Offene Probleme / Blockaden

Keine. Build läuft, Backend ist syntaktisch sauber. Erste Schritt: DB-Einrichtung.
