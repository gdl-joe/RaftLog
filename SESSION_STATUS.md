# Projektstand — RaftLog
Zuletzt aktualisiert: 2026-05-20

## Was wurde gemacht

### Session 1 — Konzept + Design
- Brainstorming, Vorgabe-Recherche (CaveLog, Camperstop)
- `PLAN.md`, `DESIGN.md` — Stack, Schema, API, Screens, Tokens
- `mockups/` — gerenderte HTML-Mockups mit Viewport-/Theme-Switcher

### Session 2 — Implementierung
- Backend komplett (PHP/MySQL): Schema (11 Tabellen), Lib (Auth/Database/Response/GpxParser), 12 API-Endpoints
- Frontend komplett (Vite + React + Tailwind, PWA): App-Shell mit Sidebar (Desktop) und Bottom-Nav (Mobile), 9 Screens, MapyMap + PhotoLightbox
- Build-Pipeline läuft

### Session 3 — Deployment auf all-inkl
- Subdomain `raft.js25.de` eingerichtet, PHP 8.5, MySQL-DB angelegt
- `.htaccess` mehrfach gefixt: `DirectoryMatch` → `RewriteRule` (in .htaccess nicht erlaubt), `[L]` → `[END]`, `DirectoryIndex public/index.html`, explizite Root-Rule
- Document-Root-Pfad korrigiert (war anfangs falsch gesetzt)
- Setup-Skript via Inkognito ausgeführt (Service-Worker blockierte normale Navigation)
- Admin angelegt, erstes Login funktioniert
- `setup/` ist (sollte) gelöscht (sein) — bitte verifizieren

### Session 4 — Karten-Picker + GitHub (heute)
- **MapPicker-Komponente** neu: Leaflet-basiert, mit Geocoding (Nominatim), Geolocation-Button, draggable Markern, zwei Modi (`single` / `start_end`)
- **NewScreen** Schritt 2: Beim Anlegen eines neuen Gewässers Karten-Picker für Position (See/Höhle: single, Portage: start_end)
- **NewScreen** Schritt 3: Beim Fluss-Trip Karten-Picker für Ein-/Ausstieg (put_in/take_out)
- **EditTripScreen**: Karten-Picker für Fluss-Koordinaten nachträglich
- Build erfolgreich: 49 Module, 364 KB JS, 41 KB CSS, PWA-Manifest
- **GitHub-Repo veröffentlicht**: https://github.com/gdl-joe/RaftLog (public, MIT)
- `.gitignore` robuster: ignoriert komplette Build-Artefakte aus `public/`
- `README.md`, `LICENSE` (MIT), `DEPLOYMENT.md` ergänzt
- Initial-Commit auf `main`-Branch

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Backend-API | ✅ läuft auf raft.js25.de |
| DB-Schema | ✅ importiert, 11 Tabellen |
| Frontend | ✅ deployt, Login funktioniert |
| Karten-Picker | ✅ implementiert (NewScreen + EditTripScreen) — **noch nicht deployt** |
| GPX-Upload | ✅ Backend fertig, Detail-Tab "Karte & Track" → "GPX hochladen" |
| Foto-Upload | ✅ parallel mit 3 Workers |
| GitHub-Repo | ✅ public unter [gdl-joe/RaftLog](https://github.com/gdl-joe/RaftLog) |
| Mapy.cz-Key | ❌ noch nicht eingetragen (OSM-Fallback aktiv) |

## Was Jochen jetzt tun muss

1. **Neuen Build hochladen** — die neue `public/`-Version mit Karten-Picker:
   - `public/assets/index-DC9-qYCP.js` (neu)
   - `public/assets/index-locR5EgZ.css` (neu)
   - `public/index.html` (neu)
   - `public/sw.js` (neu)
   - **Alte Hash-Files in `public/assets/` löschen** (saubere Variante)
2. **Browser-Cache leeren** auf raft.js25.de:
   - F12 → Application → Service Workers → Unregister
   - Application → Storage → Clear site data
   - Reload mit `Cmd+Shift+R`
3. **Karten-Picker testen**:
   - Neue Befahrung "Fluss" anlegen → Schritt 3: Karte erscheint, Klick setzt Punkt A (Einstieg), nächster Klick Punkt B (Ausstieg)
   - Detail-Tab "Karte & Track" zeigt die Punkte
4. **Optional**: mapy.cz-Key besorgen ([developer.mapy.cz](https://developer.mapy.cz)) und in `<meta name="mapy-key">` in `public/index.html` eintragen

## GitHub-Workflow ab jetzt

```bash
# Änderungen committen
cd /Users/Jochen/Sites/localhost/RaftLog
git add .
git commit -m "Aussagekräftige Beschreibung"
git push

# Neue Features
git checkout -b feature/xyz
# … arbeiten …
git push -u origin feature/xyz
# Dann PR auf GitHub erstellen
```

## Nächste Schritte (Backlog)

- Live-Tracking-UI im NewScreen (Backend ist fertig: POST `/api/tracks` mit `source=live`)
- Drag-&-Drop-Foto-Zone (page-weit)
- mapy.cz-Key einbauen
- Map-Vorschau in WatersScreen-Cards (jetzt wo Gewässer Koordinaten haben)
- PDF/Markdown-Export für einzelne Trips
- Pegelonline-Integration für DE-Flüsse

## Offene Probleme / Blockaden

Keine.
