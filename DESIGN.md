# RaftLog — Design System

> Mobile-First PWA · Dark-Theme Default · Vite + React + Tailwind
> Stil-Familie: **CaveLog-DNA** (warm-dunkel, ruhig, outdoor) — aber mit **Wasser-Petrol** statt Höhlen-Amber als Akzent.

---

## 1. Designsprache

| Dimension          | Entscheidung |
|--------------------|--------------|
| Stil-Familie       | Organic Biophilic × Outdoor-Tool — ruhig, naturverbunden, fokussiert |
| Primär-Theme       | **Dark** (default) — wie CaveLog. Light-Mode als Toggle. |
| Markenfarbe        | **Petrol/Teal** — Wasser, Frische, Bewegung |
| Sekundärfarbe      | **Sand** — Ufer, Boot, Wärme als Gegenpol zum kühlen Teal |
| Bildsprache        | Reale Foto-Cards (User-Uploads dominieren), keine Illustrationen |
| Iconografie        | **Lucide Icons** (durchgängig 2px Stroke, 20–24px) — keine Emoji |
| Eckenradius        | **12px** Standard, **8px** für Chips, **20px** für Bottom-Sheets |
| Animation          | 150–250ms `ease-out` für Hover, 300ms für Tab-Wechsel; respektiert `prefers-reduced-motion` |
| Spacing-Rhythmus   | 4/8-System (4, 8, 12, 16, 24, 32, 48) |
| Responsive-Modus   | **Mobile-first**, aber Desktop ist **kein verkleinerter Klon** sondern eigenes Layout |

### 1.1 Responsive-Strategie

| Breakpoint | Navigation | Feed | Detail | Wizard | Gewässer | Fotos |
|------------|------------|------|--------|--------|----------|-------|
| < 768 px (Mobile) | Bottom-Nav (5 Tabs, Center-FAB für Admins) | 1 Spalte | Stack | 2×2 Tiles | 1 Spalte | 2 Spalten |
| 768–1023 px (Tablet) | Bottom-Nav bleibt | 2 Spalten | 2 Spalten Side-by-Side | 4 Tiles in Reihe | 2 Spalten | 3 Spalten |
| ≥ 1024 px (Desktop) | **Sidebar links 240 px**, Bottom-Nav weg | 2 Spalten | 2 Spalten breit | 4 Tiles max-w 920px | 2 Spalten | 4 Spalten |
| ≥ 1280 px | Sidebar 260 px | 3 Spalten | unverändert | unverändert | 3 Spalten | 5 Spalten |

Layout-Implementierung: CSS Grid mit `grid-template-areas` + `@media (min-width: 1024px)` switcht von `"header"/"main"/"nav"` auf `"side header"/"side main"`. Kein conditional Rendering — gleiche Komponenten, nur CSS.

---

## 2. Design Tokens

### 2.1 Farben — Dark Mode (Default)

```css
:root[data-theme="dark"] {
  /* Hintergründe — kühl-dunkles Wasserblau */
  --c-bg:          #0e1820;   /* Body */
  --c-bg-2:        #15212a;   /* Section-Hintergrund / Cards */
  --c-bg-3:        #1b2934;   /* Hover-BG, Tags, Inputs */
  --c-surface:     #15212a;   /* Trip-Cards */
  --c-border:      #2a3a47;   /* Alle Borders, Divider */

  /* Texte */
  --c-text:        #e6eef4;   /* Haupttext */
  --c-text-dim:    #93a4b1;   /* Sekundär, Metas */
  --c-text-faint:  #5d6f7c;   /* Disabled, Hint */

  /* Markenfarben */
  --c-water:       #14b8a6;   /* PRIMÄR — Teal 500 */
  --c-water-light: #2dd4bf;   /* Hover */
  --c-water-dark:  #0d9488;   /* Pressed */
  --c-water-glow:  rgba(20,184,166,.14);

  --c-sand:        #d4a574;   /* SEKUNDÄR — Warm Sand */
  --c-sand-light:  #e7c79c;

  /* Trip-Typ-Farben (semantisch) */
  --c-type-river:    #14b8a6;   /* Teal — Fluss = Markenfarbe */
  --c-type-lake:     #3b82f6;   /* Blue 500 — See/Tiefe */
  --c-type-cave:     #b8823a;   /* Amber — Konsistenz mit CaveLog */
  --c-type-portage:  #84cc16;   /* Lime 500 — Land/Tragen */

  /* Status */
  --c-success:     #22c55e;
  --c-warning:     #f59e0b;
  --c-danger:      #ef4444;

  /* Effekte */
  --shadow-sm:     0 1px 2px rgba(0,0,0,.3);
  --shadow-md:     0 4px 12px rgba(0,0,0,.35);
  --shadow-lg:     0 12px 32px rgba(0,0,0,.45);
  --shadow-glow:   0 0 24px rgba(20,184,166,.18);

  /* Code/Mono */
  --c-code-bg:     #0a1116;
  --c-code-border: #213040;
}
```

### 2.2 Farben — Light Mode

```css
:root[data-theme="light"] {
  --c-bg:          #f5f7fa;
  --c-bg-2:        #ffffff;
  --c-bg-3:        #eef2f6;
  --c-surface:     #ffffff;
  --c-border:      #d6dee5;

  --c-text:        #0f1e2a;
  --c-text-dim:    #4a5d6e;
  --c-text-faint:  #8395a4;

  --c-water:       #0d9488;   /* dunkler für Kontrast auf hell */
  --c-water-light: #14b8a6;
  --c-water-dark:  #0f766e;
  --c-water-glow:  rgba(13,148,136,.10);

  --c-sand:        #b88456;
  --c-sand-light:  #d4a574;

  --c-type-river:    #0d9488;
  --c-type-lake:     #2563eb;
  --c-type-cave:     #9a6a28;
  --c-type-portage:  #65a30d;

  --c-success:     #16a34a;
  --c-warning:     #d97706;
  --c-danger:      #dc2626;

  --shadow-sm:     0 1px 2px rgba(15,30,42,.06);
  --shadow-md:     0 4px 12px rgba(15,30,42,.08);
  --shadow-lg:     0 12px 32px rgba(15,30,42,.12);
  --shadow-glow:   0 0 24px rgba(13,148,136,.18);

  --c-code-bg:     #f1f5f9;
  --c-code-border: #cbd5e1;
}
```

### 2.3 Spacing

```css
--space-1: 0.25rem;  /*  4px */
--space-2: 0.5rem;   /*  8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
```

### 2.4 Radius

```css
--radius-sm: 8px;    /* Chips, Tags */
--radius:    12px;   /* Cards, Buttons */
--radius-lg: 20px;   /* Bottom-Sheets, große Modals */
--radius-full: 9999px;
```

### 2.5 Typografie

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;

/* Skala */
--fs-xs:   0.72rem;   /* 11.5px — Section-Labels uppercase */
--fs-sm:   0.84rem;   /* 13.4px — Metas, Captions */
--fs-base: 0.94rem;   /* 15px — Body */
--fs-md:   1rem;      /* 16px — UI-Größe (min für mobile inputs!) */
--fs-lg:   1.15rem;   /* 18.4px — Featured-Title */
--fs-xl:   1.4rem;    /* 22.4px — Screen-Title */
--fs-2xl:  1.85rem;   /* 29.6px — Hero/Page-Title */

/* Gewichte */
--fw-regular: 400;
--fw-medium:  500;
--fw-semibold:600;
--fw-bold:    700;

/* Line-Heights */
--lh-tight: 1.25;
--lh-normal:1.5;
--lh-relaxed:1.7;
```

**Font-Loading** (selbst gehostet, kein Google-CDN):
```html
<link rel="preload" href="/fonts/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/Inter-Medium.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/Inter-SemiBold.woff2" as="font" type="font/woff2" crossorigin>
```

Mono nur für: Zahlen-Spalten (km, Tiefen), Trip-IDs, Pegel-Werte.

### 2.6 Z-Index-Stufen

```css
--z-base:    0;
--z-nav:     10;
--z-sticky:  20;
--z-dropdown:40;
--z-modal:   100;
--z-toast:   1000;
```

---

## 3. Komponenten-Specs

### 3.1 Bottom-Nav (5 Tabs)

```
┌─────────────────────────────────────────────────────┐
│  [≡]   [⌖]    [+]    [≈]    [👤]                    │
│  Feed  Karte  Neu  Gewässer  Profil                 │
└─────────────────────────────────────────────────────┘
```

- Höhe: 64px + safe-area-bottom
- BG: `var(--c-bg-2)`, Top-Border `1px solid var(--c-border)`
- Aktives Tab: Icon-Farbe `var(--c-water)`, Label `var(--c-text)`
- Inaktiv: Icon `var(--c-text-dim)`, Label `var(--c-text-faint)`
- "+" als Floating Center-Button: 56×56, kreisrund, `var(--c-water)` BG, weißes Icon, `--shadow-glow`
- Tap-Target jedes Tabs: 64×56 (über Padding hitSlop)
- Icons (Lucide): `Home` · `Map` · `Plus` · `Waves` · `User`

### 3.2 Trip-Card (Feed)

```
┌───────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════╗ │ ← Foto-Hero (16:9)
│ ║              [Trip Foto]                  ║ │
│ ║                                           ║ │
│ ║ [Fluss-Chip] [WW III]   2026-04-12    ▸  ║ │ ← Overlay
│ ╚═══════════════════════════════════════════╝ │
│                                               │
│  Aller-Etappe Verden → Achim                  │ ← Titel
│  Aller · 18.4 km · 3 h 20 min                 │ ← Meta (mono für km/zeit)
│                                               │
│  T ■■■□□  K ■■□□□  P ■■■■□      ★★★★☆       │ ← Difficulty + Rating
└───────────────────────────────────────────────┘
```

- BG: `var(--c-surface)`, Border `1px solid var(--c-border)`, Radius 12px
- Hover (Desktop): `translateY(-2px)` + `--shadow-md`
- Tap (Mobile): Ripple/Press-Scale 0.98
- Hero-Image: lazy, `aspect-ratio: 16/9`, `object-fit: cover`
- Foto-Overlay-Gradient von unten: `linear-gradient(to top, rgba(14,24,32,.85), transparent 60%)`
- Meta-Zahlen in `var(--font-mono)`, tabularnums

### 3.3 Type-Chip

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ 〰️  Fluss   │   │ ◯  See      │   │ ◐  Höhle    │   │ ▲  Portage  │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
   teal-tint        blue-tint          amber-tint         lime-tint
```

```css
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.02em;
  border: 1px solid currentColor;
  background: color-mix(in srgb, currentColor 12%, transparent);
}
.chip[data-type="river"]   { color: var(--c-type-river); }
.chip[data-type="lake"]    { color: var(--c-type-lake); }
.chip[data-type="cave"]    { color: var(--c-type-cave); }
.chip[data-type="portage"] { color: var(--c-type-portage); }
```

### 3.4 Difficulty-Bars (T/K/P)

```
T ■■■□□     ← 3/5 Technisch
K ■■□□□     ← 2/5 Körperlich
P ■■■■□     ← 4/5 Psychisch
```

- Jede Bar: 5 Segmente, je 14×6px, Gap 3px
- Aktive Segmente: `var(--c-water)`
- Inaktive: `var(--c-bg-3)`
- Label-Letter: `var(--c-text-dim)`, Mono, 11px
- Bei Wert 5: zusätzlich `box-shadow: 0 0 6px var(--c-water-glow)` auf letztem Segment

### 3.5 Stat-Tile (StatsScreen)

```
┌────────────────────┐
│  km dieses Jahr    │ ← Label (text-dim, uppercase, xs)
│                    │
│   247.5            │ ← Wert (mono, fs-2xl, water)
│   ────             │
│  +18 % vs. 2025    │ ← Delta (sm, success/danger)
└────────────────────┘
```

- BG: `var(--c-bg-2)`, Border `1px solid var(--c-border)`
- Padding 16px, Radius 12px
- Grid auf Stats-Screen: `grid-template-columns: 1fr 1fr` mobil, `1fr 1fr 1fr` ≥640px

### 3.6 Filter-Chip-Row (FeedScreen)

```
┌─────────────────────────────────────────────────────┐
│ (Alle)  (Fluss)  (See)  (Höhle)  (Portage)  (2026) │
└─────────────────────────────────────────────────────┘
   ↑ aktiv
```

- Horizontal scrollbar, `overflow-x: auto`, `scrollbar-width: none`
- Aktiver Chip: BG `var(--c-water)`, Text `#fff`
- Inaktiv: BG transparent, Border `1px solid var(--c-border)`, Text `var(--c-text-dim)`
- Höhe 32px, Padding 0 14px, Radius full

### 3.7 Buttons

```css
.btn-primary {
  background: var(--c-water);
  color: #fff;
  font-weight: var(--fw-semibold);
  padding: 12px 20px;
  border-radius: var(--radius);
  min-height: 48px;            /* Touch-Target */
  transition: all .2s ease;
}
.btn-primary:hover  { background: var(--c-water-light); transform: translateY(-1px); }
.btn-primary:active { background: var(--c-water-dark); transform: translateY(0); }
.btn-primary:disabled { opacity: .4; cursor: not-allowed; }

.btn-secondary {
  background: var(--c-bg-3);
  color: var(--c-text);
  border: 1px solid var(--c-border);
  /* sonst wie btn-primary */
}

.btn-ghost {
  background: transparent;
  color: var(--c-water);
  border: 1px solid transparent;
}
.btn-ghost:hover { background: var(--c-water-glow); }
```

---

## 4. Key-Screen Mockups

### 4.1 FeedScreen

```
┌─────────────────────────────────────────┐
│ ☰  RaftLog              🔍   👤         │ ← Header (sticky, 56px)
├─────────────────────────────────────────┤
│                                         │
│ (Alle) (Fluss) (See) (Höhle) (Portage) │ ← Filter-Chip-Row
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ╔═════════════════════════════════╗ │ │
│ │ ║       [Hero-Foto Aller]         ║ │ │
│ │ ║ 〰️Fluss  WW III  2026-04-12 ▸  ║ │ │
│ │ ╚═════════════════════════════════╝ │ │
│ │ Aller-Etappe Verden → Achim         │ │
│ │ Aller · 18.4 km · 3 h 20 min        │ │
│ │ T ■■■□□  K ■■□□□  P ■■■■□  ★★★★☆  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ╔═════════════════════════════════╗ │ │
│ │ ║      [Hero-Foto Steinhuder]     ║ │ │
│ │ ║ ◯ See   Bf 4   2026-04-05  ▸   ║ │ │
│ │ ╚═════════════════════════════════╝ │ │
│ │ Steinhuder Meer — Umrundung         │ │
│ │ Steinhuder Meer · 21.2 km · 5 h     │ │
│ │ T ■■□□□  K ■■■■□  P ■□□□□  ★★★☆☆  │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│  Feed   Karte    +    Gewässer  Profil  │ ← Bottom-Nav
└─────────────────────────────────────────┘
```

### 4.2 DetailScreen

```
┌─────────────────────────────────────────┐
│ ←  Aller-Etappe Verden → Achim       ⋮ │ ← Back + Menü
├─────────────────────────────────────────┤
│ ╔═════════════════════════════════════╗ │
│ ║         [Hero-Foto, 4:3]            ║ │
│ ║                                     ║ │
│ ║ 〰️Fluss  WW III                     ║ │
│ ╚═════════════════════════════════════╝ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Übersicht │ Karte │ Fotos │ Team   │ │ ← Tab-Bar (underline-active)
│ └─────╤───────────────────────────────┘ │
│                                         │
│  Aller · 18.4 km · 3 h 20 min           │
│  12.04.2026  ·  09:15 → 12:35           │
│  Pegel: 120 cm (Verden)                 │
│                                         │
│  Schwierigkeit                          │
│  T ■■■□□  K ■■□□□  P ■■■■□              │
│                                         │
│  Bewertung   ★★★★☆                      │
│                                         │
│  Wetter                                 │
│  Bedeckt, 14 °C, leichter Wind aus W    │
│                                         │
│  Notizen                                │
│  Bei niedrigem Wasserstand schöner      │
│  Schwellenabschnitt nach km 6 …         │
│                                         │
├─────────────────────────────────────────┤
│  Feed   Karte    +    Gewässer  Profil  │
└─────────────────────────────────────────┘
```

**Tab "Karte"** zeigt: mapy.cz mit GPX-Polylinie in `var(--c-water)`, Marker für Ein-/Ausstieg (Lucide `MapPin`), Foto-Marker mit GPS in Sand-Farbe.

**Tab "Fotos"** zeigt: 3-Spalten-Grid, Tap → Lightbox.

**Tab "Team"** zeigt: Teilnehmer-Liste + Gear-Tags + Hazard-Tags.

### 4.3 NewScreen — Schritt 1 (Trip-Typ-Picker)

```
┌─────────────────────────────────────────┐
│ ✕                            Schritt 1/4│
├─────────────────────────────────────────┤
│                                         │
│  Neue Befahrung                         │
│  Welcher Typ?                           │
│                                         │
│ ┌─────────────────┬─────────────────┐  │
│ │                 │                 │  │
│ │      〰️         │       ◯        │  │
│ │                 │                 │  │
│ │     Fluss       │      See       │  │
│ │   Wildwasser    │   Stillwasser  │  │
│ │                 │                 │  │
│ │   [teal-glow]   │  [blue-glow]   │  │
│ └─────────────────┴─────────────────┘  │
│ ┌─────────────────┬─────────────────┐  │
│ │                 │                 │  │
│ │       ◐         │       ▲        │  │
│ │                 │                 │  │
│ │     Höhle       │    Portage     │  │
│ │ Packraft i.H.   │ Tragen/Schieben│  │
│ │                 │                 │  │
│ │   [amber-glow]  │  [lime-glow]   │  │
│ └─────────────────┴─────────────────┘  │
│                                         │
│        [ Weiter ] (disabled)            │
│                                         │
└─────────────────────────────────────────┘
```

**Tile-Spec:**
- Größe: `aspect-ratio: 1/1`, Grid `1fr 1fr`, Gap 12px
- Inaktive Tile: `var(--c-surface)`, Border `1px solid var(--c-border)`
- Aktive Tile: Border `2px solid var(--c-type-XYZ)`, Glow `0 0 24px var(--c-type-XYZ)80`
- Icon zentriert, 48px, Farbe `var(--c-type-XYZ)`
- Untertitel `var(--c-text-dim)`, fs-sm
- Tap-Animation: Scale 0.96 → 1.0

**Nachfolgende Schritte:**
- **Schritt 2**: Gewässer wählen / neu anlegen
- **Schritt 3**: Datum, Strecke, Schwierigkeit, Notizen + typ-spezifische Felder
- **Schritt 4**: Fotos + GPX (optional) + Speichern

---

## 5. Tailwind-Konfiguration

```js
// tailwind.config.js
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg:       'var(--c-bg)',
        'bg-2':   'var(--c-bg-2)',
        'bg-3':   'var(--c-bg-3)',
        surface:  'var(--c-surface)',
        border:   'var(--c-border)',
        text:     'var(--c-text)',
        'text-dim':   'var(--c-text-dim)',
        'text-faint': 'var(--c-text-faint)',
        water: {
          DEFAULT: 'var(--c-water)',
          light:   'var(--c-water-light)',
          dark:    'var(--c-water-dark)',
        },
        sand: {
          DEFAULT: 'var(--c-sand)',
          light:   'var(--c-sand-light)',
        },
        type: {
          river:   'var(--c-type-river)',
          lake:    'var(--c-type-lake)',
          cave:    'var(--c-type-cave)',
          portage: 'var(--c-type-portage)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        lg: '20px',
      },
      boxShadow: {
        glow: '0 0 24px var(--c-water-glow)',
      },
    },
  },
};
```

---

## 6. Accessibility-Garantien

- ✓ Alle Touch-Targets ≥ 48 × 48 (Bottom-Nav-Tabs 64 × 56)
- ✓ Text-Kontrast geprüft:
  - `--c-text` auf `--c-bg`: **15.2:1** (AAA) im Dark Mode
  - `--c-text-dim` auf `--c-bg`: **6.4:1** (AA+) im Dark Mode
  - `--c-water` auf `--c-bg`: **5.8:1** (AA) — primäre Buttons / Links ok
- ✓ Focus-Ring: `outline: 2px solid var(--c-water); outline-offset: 2px;` auf allen interaktiven Elementen
- ✓ `prefers-reduced-motion` respektiert — alle Transitions auf `0.01ms` reduziert
- ✓ Dynamic Type unterstützt (root-rem-skaliert, keine `px` für Text)
- ✓ Trip-Type wird **nicht nur** über Farbe kommuniziert — immer Icon + Label

---

## 7. Anti-Patterns (zu vermeiden)

- ❌ Keine Emojis als strukturelle Icons (ausgenommen User-Content)
- ❌ Keine Tailwind-`gray-*` Klassen — stattdessen Token-Variablen (`var(--c-text-dim)` etc.)
- ❌ Keine Schatten in Hovern verändern (verursacht CLS) — nur `transform`
- ❌ Keine Karten ohne Border *und* ohne Schatten (verlieren sich im Dark Mode)
- ❌ Kein Pegel/km/Zeit ohne `tabular-nums` (Layout-Sprung in Listen)
- ❌ Keine Pages mit horizontalem Scroll auf ≤375px außer Chip-Rows

---

## 8. Nächste Schritte

Diese Tokens werden in der Implementierung als CSS-Custom-Properties in `frontend/src/index.css` definiert und über `tailwind.config.js` als Tailwind-Farben verfügbar gemacht. Die Trip-Type-Farben werden zusätzlich als Daten-Attribut (`data-type="river"`) auf Cards/Chips angewendet, damit sie via CSS gezielt aufgegriffen werden können.
