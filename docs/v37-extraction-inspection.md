# Root Tap, Deep Root, Chitin Vat: what the code does today (inspection for the art brief)

Checked in the current build (v36, `index.html`). Tiles are 24 px; all three are 2×2 (48×48 px), drawn from their top-left tile `(b.x, b.y)`, no rotation (`rot` is ignored for them).

## Root Tap (`drill`) and Deep Root (`pdrill`)

| | Root Tap | Deep Root |
| --- | --- | --- |
| Health | 120 | 160 |
| Cost | 12 copper | 18 copper, 10 resin |
| Rate per ore tile | 0.15 items/s | 0.22 items/s |
| Ores | copper, lead, coal, sand (sand ground counts as sand) | the same plus titanium (titanium at 70% speed) |

- **What it mines:** when placed it counts the ore under its four tiles and takes the most common one (`drillOre`): `b.oreItem` (the item) and `b.oreCount` (1 to 4 tiles). This never changes afterwards. More ore tiles under it means faster gathering.
- **Work:** each tick `b.prog += dt × oreCount × rate` (×0.7 for titanium); at 1 it adds one item to `b.out`, which holds up to 10.
- **Output:** every tick, if `b.out > 0`, it hands one item to the next neighbour round its ring that will take it (`offload`, round robin `b.rr`): vines not pointing into it, the Bloom, glands, turrets that take that ammo, and so on. Never to another Root Tap or Deep Root. Any of the 8 edge tiles around it can take output, so there is no fixed output side.
- **States the art can read:**
  - working: `b.oreItem >= 0 && b.out < 10`
  - blocked (full, nowhere to send): `b.out >= 10` (the panel already shows "Output blocked")
  - no ore: `b.oreItem < 0` (can't happen for a placed one in normal play)
  - progress toward the next item: `b.prog` (0 to 1)
- **Animation triggers:** none exist. The current art only spins three tendrils while working. "An item was just mined" or "an item just left" would have to be detected by the art watching `b.out` change, the same way the painted organs do (`OST`, kept outside the block so nothing reaches a save).

## Chitin Vat (`smelter`)

- Health 200, cost 30 copper and 25 lead, uses 30 vigor.
- **Recipe:** 1 coal and 2 sand make 1 chitin, in 0.8 s at full vigor. With less vigor it slows in proportion (`G.powSat`); with none it stops.
- **Input:** takes coal and sand from any side (`b.inv[COAL]`, `b.inv[SAND]`).
- **Output:** chitin in `b.out` (up to 10), handed to the next neighbour that will take it, from any side (`offload`).
- **States the art can read:**
  - wants to work: `b.wants` (has the inputs and room for output)
  - actually working: `b.wants && G.powSat > 0`
  - progress: `b.prog` (0 to 1, back to 0 on each chitin)
  - stocks: `b.inv[COAL]`, `b.inv[SAND]`, `b.out`
- **Animation triggers:** none exist. Finishing a chitin and shipping one would be detected from `b.prog` falling back and `b.out` changing.

## Shared effects

- **Construction:** a new structure fades in from 40% to full opacity over 0.25 s (`b.built` 0→1).
- **Damage:** `hurtBlock` sets `b.hit = 0.12` s and the renderer lays a white flash over the footprint. The health bar is drawn separately, on top.
- **Selection:** a team-coloured rectangle round the footprint.

## Current artwork and fallbacks

- None of the three has painted PNG art yet. They use the procedural looks: classic (Low), HD (`spr()` shell sprite plus spinning tendrils for the taps, a wet pod for the Vat), and the older flat look.
- The painted-art system (`ART.plant`) already handles PNG loading, a `ready`/`failed` state per structure, cached resting pictures, crowd limits, zoom detail, the build-menu icon and the fallback to the previous look on Low or if a file is missing. The Resin Gland (`drawResin`, `drawResinUnder`, `art/plant/resin-gland/`, painted by `art/source/paint_organs.js`) is the closest model: a 2×2 organ with roots under its neighbours, a fluid level from game state and pulses on real events.
