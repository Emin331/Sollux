# SOLLUX landing page – IdoMods frontend + AI recruitment task

Static landing page coded from the Figma design. Plain HTML + CSS  no build step, no dependencies, no Node.

## Run it

Option A (simplest): open `index.html` in any modern browser (double-click).

Option B (local server):

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

Notes:
- The font (Red Hat Display) is loaded from Google Fonts. Offline, the page falls back to Helvetica/Arial and still works.
- The shader section needs WebGL. Without it, a static CSS gradient is shown.

## Structure

```
index.html   markup + SVG icon sprite
styles.css   all styling and CSS transitions

```

## Implementation of the "Komentarze do projektu" notes

| Note | Implementation |
|---|---|
| 01 General | Hover 200–250 ms, larger moves 500–800 ms. One easing `cubic-bezier(0.4,0,0.2,1)` (`--ease`), ease-out for scale-ups (`--ease-out`). Only `transform` and `opacity` are animated. |
| 02 Menu | On hover/focus the header goes transparent → `#FFFFFF` and white → black, 250 ms, ease-in-out, back on mouse-out. Because only transform/opacity may be animated, this is a crossfade: a white background layer plus two stacked content layers (white and black). The black layer is a decorative `inert`/`aria-hidden` clone built by `main.js`; the real links live in the white layer. The same state is applied after scrolling past the hero so the fixed header stays readable on white. |
| 03 Hero lamps | Lamps follow the cursor (parallax, each with its own depth, slight rotation, eased with a lerp loop). Clicking a lamp (or Enter/Space, they are real buttons with `aria-pressed`) switches its light on/off with a glow on the lens. |
| 04 Slider | Autoplay every 3 s, crossfade 600 ms ease-in-out, image scale 1.05 → 1.0 over 800 ms ease-out, yellow progress bar fills linearly over 3 s and resets on slide change. The progress bar's `animationend` is the timer, so the bar and the slide never drift apart. |
| 05 Tiles | Hover: image scale 1 → 1.1, 500 ms, ease-out, clipped by the tile (`overflow: hidden`). Button black → `#4A4A4A`, 200 ms, ease-in-out (a grey layer fading in via opacity). |
| 06 Shader | Real-time WebGL fragment shader (domain-warped fbm noise), no GIF/video. Seamless loop: time only enters the noise through `cos/sin(phase)` with a 25 s period, so the last frame equals the first. Rendered at half resolution, paused when off-screen or when the tab is hidden. Text and button are static above the canvas. |

`prefers-reduced-motion` is respected: no autoplay, no parallax, a single static shader frame, near-instant transitions.

## Assumptions and notes

- The brief only supplied the design as images, so the slide 2 of the hero (interior render) keeps the same headline, button and arrows as slide 1, with a light dark gradient added for readability.
- Every size, gap, font size/weight, radius and colour was taken from the original `.fig` (Landingp page, 1920 × 4048, content width 1600 px): header 84 px, tiles 648 / 936 × 518, shader 835 px, footer 3 × 512 cells, etc. The page height at 1920 px is exactly 4048 px.
- Lamps (3 PNGs) are cropped from the original 1920×1080 layer and placed at the exact design coordinates; the hero background (`hero-bg.jpg`) is the design's background with lamps, text and UI removed. `hero-interior.jpg` is the original slide-2 image.
- The four tile images were rebuilt from the original Figma layers (mockups, colour wheel, fade gradients, phone-screen masks) at 2× resolution; tile texts are live HTML.
- The SOLLUX wordmark and all icons are the original Figma vectors, inlined as an SVG sprite (`currentColor`).
- The shader section is an image in the design; its headline (≈52 px), button (56 px) and note (≈16 px) sizes were measured from it, so they are estimates.
- Footer payment / award / flag images are still crops from the design screenshot (no separate exports in the file).
- Copy follows the design, except for "Pobierz aplikację" (the design has the typo "aplikacje") and "Współpraca" (design: "Wpsółpraca").
- Navigation dropdowns are not part of the brief; the chevrons are visual only.
- Layout is designed at 1920 px (content width 1600 px) and made responsive down to mobile.

## AI conversation

The full AI conversation (with the skills, plugins and MCP servers used) is delivered separately as an export, with secrets and unrelated personal data removed.
