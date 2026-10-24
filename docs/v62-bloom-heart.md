# v62: the Bloom Heart

The pale seed that floated in the Bloom's glass chamber is replaced by the **Bloom Heart**, a painted violet heart that beats with the Bloom. The pictures are in `docs/screenshots/v62/`.

This is for looks only. Gameplay, the Bloom's stats and name, saves and the beat's timing are unchanged.

## Why not AutoSprite

The heart was meant to come from AutoSprite. Its connector is installed, but it refuses to generate anything without a paid AutoSprite plan, so the heart was painted with the same canvas painter as the rest of the Bloom (`art/source/paint_bloom.js`). If AutoSprite art is wanted later, it only has to replace `art/plant/bloom/heart.png` (256×256, transparent, the heart centred).

## What changed

- `art/plant/bloom/heart.png` replaces `core.png`. Violet flesh lit from the upper left, muscle fibres wrapping towards the apex, a groove between the ventricles, two atria, five vessel trunks rising from the top and fading into the fluid, and turquoise surface vessels in the Rootweb's nutrient colour.
- `ART.plant.core`: the layer is `heart.png`, drawn at 0.27 of the box (was 0.24) with `beat:2.4`.
- `artLayer` (`bob`): a layer with `beat` is drawn smaller by `beat` times the beat's contraction (`CIRC.A`, carried as `artHA` while the player's own Bloom is drawn), so the heart squeezes about 7 to 8% when the chamber tightens about 3 to 4%.
- The title background and the menu's Factory and First Contact pictures were rendered again with the new heart.

## Checks

- `tests/xtest62.js`: all pass (art loads with no `core.png`; heart squeeze 7.6% against the chamber's 3.7%; still with reduced motion; drawn Bloom fine with art off; no page errors).
- `tests/xtest61.js` (circulation, 41 checks): all pass, including the save being identical after 20 s of drawing.
- `lcbloom`, `lcquick`, `lcart`: same output as v61 run side by side, apart from the run-to-run differences of their unseeded games and timings. Both builds report the same cross-origin canvas warnings from `file://`.
- The title painter, run on v61 and on this build, gives a v61 image identical to the one in the repo, and this build differs only in the Bloom's chamber.
