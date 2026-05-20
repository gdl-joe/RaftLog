# RaftLog

> Mobile-First PWA zum Loggen von **Packraft-Befahrungen** auf Flüssen, Seen, in Höhlen und mit Portage-Strecken.

Eigenentwicklung von **Jochen Sühlo / b-prisma**. Hosted auf all-inkl.

![Status](https://img.shields.io/badge/status-beta-orange)
![Stack](https://img.shields.io/badge/stack-Vite%20%2B%20React%20%2B%20PHP%2FMySQL-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **4 Trip-Typen** — Fluss (WW-Grade), See (Wind/Wellen), Höhle (Tiefe/Seil/Wasserführung), Portage (Tragstrecken)
- **Einheitliche Schwierigkeit** T/K/P (Technisch · Körperlich · Psychisch) + Gesamtbewertung 1–5
- **Karten-Picker** — Ein-/Ausstieg per Klick auf der Karte setzen (mapy.cz mit OSM-Fallback)
- **GPX-Import** — Tracks aus Garmin/Komoot/Strava direkt einbinden
- **Fotos** — Parallel-Upload, EXIF-GPS-Auswertung, Lightbox, beliebig viele Fotos pro Trip
- **Statistik** — Kilometer pro Jahr × Typ, Top-Gewässer, Schwierigkeits-Histogramm, Aktivitäts-Heatmap
- **Responsive** — Bottom-Nav auf Mobile, Sidebar auf Desktop (ab 1024 px)
- **PWA** — Service Worker, Offline-Caching, installierbar
- **Multi-User** — Admin/Viewer-Rollen mit Session-basierter Auth

## Stack

| Schicht | Technologie |
|---|---|
| Frontend | Vite + React 18 + Tailwind CSS v3 |
| Karten | Leaflet + mapy.cz Tiles (OSM-Fallback) |
| Backend | PHP 8.2+ (vanilla, kein Framework) |
| DB | MySQL 8.0 (utf8mb4) |
| Auth | PHP-Sessions + CSRF-Token |
| Hosting | all-inkl.com (Shared Hosting) — kann aber auf jedem LAMP-Stack laufen |

## Schnellstart (lokal)

```bash
git clone https://github.com/gdl-joe/RaftLog.git
cd RaftLog

# Config aus Vorlage anlegen + DB-Daten eintragen
cp config/config.example.php config/config.php
# → DB-Host/Name/User/Pass in config.php setzen

# DB-Schema importieren
mysql -u root raftlog < database/schema.sql

# Frontend bauen
cd frontend
npm install
npm run dev      # Dev-Server auf http://localhost:5173

# Admin-User anlegen
# Browser: http://raftlog.test/setup/create-admin.php
# Danach: setup/ Ordner LÖSCHEN
```

Lokale Entwicklung erwartet einen lokalen Webserver wie **Herd** oder **MAMP**, der den Projekt-Root als Document-Root nutzt und PHP 8.2+ unterstützt.

## Deployment auf Webspace

Siehe **[DEPLOYMENT.md](DEPLOYMENT.md)** für detaillierte Anleitung (Beispiel all-inkl.com).

## Projektdokumentation

| Datei | Inhalt |
|---|---|
| [PLAN.md](PLAN.md) | Architektur, DB-Schema, API-Endpoints, Implementierungs-Reihenfolge |
| [DESIGN.md](DESIGN.md) | Design-Tokens, Farbpalette, Komponenten-Specs, Responsive-Strategie |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Schritt-für-Schritt-Anleitung für Produktivbetrieb |
| [SESSION_STATUS.md](SESSION_STATUS.md) | Letzter Stand der Entwicklung |
| [mockups/](mockups/) | Statische HTML-Mockups (Sandbox mit Viewport-/Theme-Switcher) |

## Datenmodell (Kern)

```
users (admin/viewer)
  │
  ├─ rivers ─────┐
  ├─ lakes ──────┤
  ├─ caves ──────┼── trips (mehrtages-fähig, polymorph)
  └─ portages ───┘     │
                       ├─ trip_team
                       ├─ trip_gear
                       ├─ trip_hazards
                       ├─ trip_tracks (GPX oder Live-Tracking)
                       └─ photos (mit EXIF-GPS)
```

Volles Schema: [database/schema.sql](database/schema.sql).

## Lizenz

MIT — siehe [LICENSE](LICENSE).

## Autor

Jochen Sühlo · [b-prisma.de](https://b-prisma.de)
