# librus-shell

Shared **LIBRUS** reader shell — multi-flavor SPA for **librus.app**, **doutrina.org**, and adhered Centers. Lean surface area, **build-time feature flags**.

## Repo map

| Repo | Role |
|------|------|
| **librus-shell** | SPA, flavors, PWA (this repo) |
| **librus-linker** | Provider link injection on content artifacts |
| **doutrina-content** | Editorial source (MD / QA) |
| **librus** / **doutrina** | Published site hosts (`dist` only) |
| `center-*` | Center manual + `flavor.json` |

Predecessor UI experiment `simple/` (if present elsewhere) is left untouched.

## Keeps

- Two screens: **library** · **reader** (no splash / onboard)  
- Bottom bar: **Home · Lang · Theme · Help · Settings**  
  - Lang & theme are **cyclers** (PT↔EN · system→light→dark)  
  - Help & Settings are **center modals**  
- Two languages: PT · EN  
- Four panes that collapse to one (breakpoints: 1650 / 1400 / 920)  
- Themes: **system · light · dark**  
- Full typography controls  
- Full search providers (Luz, wiki, dict, maps, Bible, Kardecpedia)  
- **Hypothesis** (lazy on reader)  
- Vite + PWA  
- **Lucide as inline SVG** (`src/icons.js` + `[data-icon]`) — no CDN  

## Drops (vs `simple/`)

- Splash language gate  
- Onboard / viewport animation  
- White theme mode  
- App profiles / unlock wall  
- Side drawers (modals instead)  
- BEM class trees (state classes: `.on`, `.overlay` only)  

## Flavors (multi-domain)

One codebase ships **librus.app**, **doutrina.org**, and **centro.doutrina.org**.

Edit **`public/flavors.json`** only — hosts, brand copy, favicons, catalog profile, providers, JaaS room.

| Flavor | Typical host | Shelf (`profiles` on books) |
|--------|----------------|------------------------------|
| `librus` | librus.app | Sherlock novels |
| `doutrina` | doutrina.org | Kardec codification |
| `centro` | centro.doutrina.org | Codification + Centro manual (pinned first) |

**How flavor is chosen** (first match wins):

1. `?flavor=doutrina` in the URL (local QA)
2. `localStorage.librus-flavor` (sticky override)
3. `VITE_FLAVOR=…` at build/dev time
4. `hostname` → `hosts` map in `flavors.json`
5. `default` in that file

```bash
npm run dev              # default / hostname
npm run dev:doutrina     # force doutrina
# or open http://localhost:5174/?flavor=centro
```

**Add a book to a flavor:** set `"profiles": ["doutrina", "centro"]` on its entry in `public/books/catalog.json`.  
**Add a flavor:** new key under `flavors`, host entries, brand assets under `public/brand/`.

## Feature flags

Defaults: hypo · typo · providers **on**; pdf · jaas · profiles **off**.

| Env | Default | Effect |
|-----|---------|--------|
| `VITE_FEAT_HYPO` | `1` | Hypothesis embed |
| `VITE_FEAT_TYPO` | `1` | Typography tab |
| `VITE_FEAT_PROVIDERS` | `1` | Context providers |
| `VITE_FEAT_PDF` | `0` | PDF tab + pdf.js |
| `VITE_FEAT_JAAS` | `0` | Video tab + JaaS |
| `VITE_FEAT_PROFILES` | `0` | Reserved |

```bash
npm install
npm run dev          # port 5174
npm run build        # lean defaults
npm run build:full   # PDF + JaaS on
npm run build:lean   # explicit pdf/jaas off
npm run build:no-hypo
npm run preview
```

Optional modules live under `src/features/` and are only imported when their flag is on (tree-shake friendly).

## Why not from day one of `simple/`?

See the session notes: discovery first, modularization later. This POC is the intentional structure after the product shape was known.
