# Known limitations

## Android phone status bar (Fullscreen API)

**Status:** accepted · **Since:** v0.9.13 (2026-09-10)  
**Affects:** tall Android phones in an installed PWA (`display: standalone`). Confirmed: Motorola G Stylus 2025 (Chrome immersive toast + black flash). Likely: other tall OEM skins.

Installed PWAs on Android still show the system status bar in portrait (~40–56 CSS px). Hiding it requires the Fullscreen API (`document.documentElement.requestFullscreen`). On many phones Chrome then:

1. paints a black frame,
2. shows “To exit full screen, drag from the top and touch the back button,”
3. often drops out of fullscreen on the next gesture or rotation.

Auto-enter on pointer-up made that the default path. That is worse than leaving the bar.

### Policy (largest prospective install base = phones)

| Form factor | How we decide | Fullscreen API | `#book-fs` |
|---|---|---|---|
| Tall Android phone | `long/short ≥ 1.85` | **off** — never call | hidden |
| Android slate / tablet (Tab M9 class) | short side ≥ 700 and ratio `< 1.85` | on, **manual only** | shown |
| Desktop / laptop | not Android, or fine pointer | on, manual | shown |
| iOS home-screen PWA | `navigator.standalone` | API unused by WebKit | hidden if API missing |

Manifest stays `display: standalone` + `display_override: [standalone, minimal-ui]` for every flavor. Do **not** ship `display: fullscreen` in the shared manifest — Tab M9 honored it, phones stacked immersive mode on standalone and crashed the first paint.

Portrait phones keep `viewport-fit=cover`, `black-translucent`, and `theme-color` matching the Leia band so the leftover bar is not a grey stripe. Landscape on phones is already blocked by the shell (rotate to portrait).

### Do not “fix” by

- calling `requestFullscreen` from `pointerup` / first tap in the book
- using `{ navigationUI: "hide" }` on Android UA
- switching the shared webmanifest back to `display: fullscreen`
