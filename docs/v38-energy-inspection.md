# v38 inspection: Sap Burner, Sunleaf and Spore Bellows in the code

What the game did before any art was changed (v37 `index.html`).

| | Sap Burner (`combustion`) | Sunleaf (`solar`) | Spore Bellows (`bellows`) |
| --- | --- | --- | --- |
| Footprint, health, cost | 1x1, 100 hp, 25 copper + 15 lead | 1x1, 80 hp, 10 copper + 10 lead | 2x2, 220 hp, 60 copper + 40 lead |
| Placement | needs Rootweb under it like other growths (`tryPlace`) | same | same |
| Input | coal, from vines, taps, Knots and Bulbs, while it holds fewer than 10 (`accepts`) | none | none |
| Behaviour (`updBlock`) | when `b.burn <= 0` and it has coal: uses one, `b.burn = 2`; `b.burn` counts down | none | none |
| Vigor (`computePower`) | +60 while `b.burn > 0` | +5 always | uses 10 always |
| Effect | | | while `G.powSat >= .25`, every Rootweb source (Bloom or Rootweb Node) whose centre is within 12 tiles of its centre spreads twice as fast (`bellowsNear`, used in `stepWeb` and the info panel) |
| Active / idle | burning / no coal | always the same | boosting a source that still has ground to cover / nothing to boost or not enough vigor |
| Animation hooks | none: state only (`b.burn`, `b.inv`) | none | none: each source's progress through its tile list (`b.wlist`, `b.wi`) and the Rootweb's birth times (`webBorn`, or `GLR.born` on the graphics card) |
| Neighbours | coal can arrive from any side | none | none (it is also a hub for the Spawning Pods' nutrient channels in the Rootweb art) |
| Saved state | the block's usual fields, `burn` and `inv` | usual fields | usual fields |

- **Damage, building and destruction** are generic: the hit flash, health bar, build fade (`built`) and selection box are drawn by the game for every block, and destroyed blocks are removed by `removeBlock`.
- **Previous drawing:** an orange orb in a dark ring (burner), a green leaf (Sunleaf), a rounded purple box with three holes (Bellows), with the HD light pass adding a warm glow round a burning burner (`hdGlow`). That light pass stays.
- **Painted-art system** (used since v33): `ART.plant[t]` with `custom` and `customUnder` painters, layers loaded from `art/plant/<name>/`, a baked resting picture (`organReady`) used for build-menu icons, far zoom and crowds, per-kind crowd limits (`ORGAN_MAX`, `organLite`), the zoom limit `ART_LOD_ZOOM = 0.75`, visual memory in `OST` (never saved), and fallback to the previous look if any layer fails to load.
- **Quality presets:** Low turns painted art off (`SET.art = 0`); Medium, High and Epic keep it on (`QUALITY`, `applyQuality`).
