# Projektstand — RaftLog
Zuletzt aktualisiert: 2026-05-20

## Was wurde gemacht

### Session 1 — Konzept + Design
- Brainstorming, Vorgabe-Recherche (CaveLog, Camperstop)
- `PLAN.md`, `DESIGN.md` — Stack, Schema, API, Screens, Tokens
- `mockups/` — gerenderte HTML-Mockups mit Viewport-/Theme-Switcher

### Session 2 — Implementierung
- Backend komplett (PHP/MySQL): 11-Tabellen-Schema, Lib (Auth/Database/Response/GpxParser), 12 API-Endpoints
- Frontend komplett (Vite + React + Tailwind, PWA): App-Shell mit Sidebar (Desktop) und Bottom-Nav (Mobile), 9 Screens, MapyMap + PhotoLightbox

### Session 3 — Deployment auf all-inkl (raft.js25.de)
- Subdomain, PHP 8.5, MySQL-DB
- `.htaccess` mehrfach gefixt: `DirectoryMatch` → `RewriteRule`, `[L]` → `[END]`, `DirectoryIndex`, explizite Root-Rule, Asset-Durchreich aus `public/`
- `.user.ini` für PHP-Upload-Limits (25M / 30M / 256M)
- Setup-Skript via Inkognito → Admin angelegt → setup/ gelöscht
- Admin-Login funktioniert

### Session 4 — Karten-Picker + GitHub
- **MapPicker-Komponente**: Leaflet-basiert, Nominatim-Geocoding, draggable Marker, single/start_end-Modi
- **GitHub-Repo veröffentlicht**: https://github.com/gdl-joe/RaftLog (public, MIT)
- `README.md`, `LICENSE`, `DEPLOYMENT.md`

### Session 5 — Iterative Fixes (heute Abend)
Eine ganze Reihe kleiner aber knackiger Bugs gefunden und gefixt:

1. **MapPicker Closure-Bug** — `map.on('click')` hielt `value` in veralteter Closure fest, sodass nach Setzen von Punkt A der nächste Klick A überschrieb statt B zu setzen. Fix: `valueRef.current` über `useRef` synchron halten.
2. **GPX-Track nicht angezeigt** — `api.listTracks()` gab nur Metadaten zurück, `points_json` fehlte → MapyMap konnte nichts zeichnen. Fix: GET-Response erweitert.
3. **GPX-Parser robust** — Namespace-tolerant für Garmin/Komoot/Strava/OSM, erkennt trkpt/rtept/wpt, sprechende Fehlermeldungen.
4. **Inline-Editor für Trip-Punkte** — DetailScreen Tab "Karte & Track" hat jetzt "Punkte setzen"-Button, der MapPicker inline öffnet. Für alle Trip-Typen.
5. **Titelfoto auswählbar** — neue Spalte `trips.cover_photo_id`, Foto-Tab mit Stern-Button und "TITELBILD"-Badge.
6. **Hero-Foto ohne Verpixelung** — large_path (1200px) statt thumb (400px), `object-contain` mit dunklem BG.
7. **EditTripScreen voll editierbar** — alle Felder: Schwierigkeit, typ-spezifisch, Team, Gear, Hazards, Karte. Zusammenklappbare Sektionen.
8. **Foto-Upload robust** — HEIC via Imagick zu JPEG konvertieren (oder klare Meldung wenn Imagick fehlt), WebP unterstützt, Memory-Limit hoch, Fallback bei Resize-Fehler.
9. **Endloses Lade-Problem** — Service Worker fing POST/PATCH/DELETE-Requests ab. Fix: SW nur GET-Caching, POST/PATCH/DELETE → NetworkOnly. Plus AbortController-Timeout (90s Upload, 20s GET) im API-Client.
10. **`/api/photos` 500** — doppelter `prepare()` mit nicht existierender `created_at`-Spalte → MySQL-Exception. Fix: einfacherer ORDER BY.
11. **Karten-Anzeige Tailwind/Leaflet-Konflikt** — Tailwind Preflight setzte `img { max-width: 100% }` global, killte Leaflet-Tiles. Fix: CSS-Override innerhalb `.leaflet-container`.
12. **MapScreen Map-Ref-Bug** — `if (!trips) return <Loading />` verhinderte, dass das Map-Div beim ersten Mount im DOM war → mapInit-Effect lief mit `mapEl.current === null`. Fix: Map immer rendern, Loading als Overlay.

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Backend-API | ✅ läuft auf raft.js25.de |
| Auth + Setup | ✅ Admin angelegt, Login funktioniert |
| Trips anlegen | ✅ vollständiger 4-Schritt-Wizard |
| Trips editieren | ✅ alle Felder editierbar |
| Karten-Picker | ✅ funktioniert (NewScreen, EditTripScreen, DetailScreen inline) |
| GPX-Import | ✅ robust, Track wird auf Karte angezeigt |
| Foto-Upload | ✅ parallel, HEIC-Handling, klare Fehlermeldungen |
| Titelfoto wählbar | ✅ Stern im Foto-Tab |
| Karten (Detail + Hauptnav) | ✅ Tiles laden, Marker erscheinen |
| GitHub-Repo | ✅ public auf https://github.com/gdl-joe/RaftLog |
| Mapy.cz-Key | ❌ noch nicht eingetragen (OSM-Fallback aktiv) |

## Schema-Migrationen (auf raft.js25.de durchgeführt?)

- `database/migration_cover_photo.sql` — ALTER TABLE trips ADD COLUMN cover_photo_id
  → **Bitte verifizieren**, ob in phpMyAdmin importiert. Andernfalls funktioniert die Titelfoto-Auswahl nicht.

## Nächste Schritte (Backlog)

- Mapy.cz-Key besorgen ([developer.mapy.cz](https://developer.mapy.cz)) und in `public/index.html` als `<meta name="mapy-key">` einbauen — gibt schönere Outdoor-Karten mit Höhenlinien
- Live-Tracking-UI im NewScreen (Backend ist fertig: POST `/api/tracks` mit `source=live`)
- Drag-&-Drop-Foto-Zone (page-weit)
- Map-Vorschau in WatersScreen-Cards
- PDF/Markdown-Export für einzelne Trips
- Pegelonline-Integration für DE-Flüsse
- Foto-Captions inline editieren
- Foto-Reihenfolge per Drag sortierbar

## Letzte Commits (auf GitHub gepusht)

```
e5f11c8 MapScreen: Karte sofort initialisieren, Loading als Overlay
d5a359e Karte sichtbar: Tailwind Preflight img-Regeln fuer Leaflet aushebeln
6cdc344 Fix 500 bei /api/photos + Karte auf MapScreen
d723df0 Karten-Anzeige fixen — Leaflet invalidateSize nach Mount
bd9c20b Foto-Upload: hängende Requests beheben
4407c76 EditTripScreen voll editierbar + Foto-Upload robuster
9be1869 Titelfoto wählbar + Hero ohne Verpixelung
ec6111e Karten-Editor inline in DetailScreen — Punkte nachträglich setzen
4a5b1e5 Fix: MapPicker setzt jetzt beide Punkte + GPX-Track wird angezeigt
0db133c GPX-Import robust machen
```

## Offene Probleme / Blockaden

Keine. Stand stabil, alle bekannten Bugs gefixt, alle Commits auf GitHub.
