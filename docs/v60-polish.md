# v60: polish on the title, the transition and the menu's scenes

Previews (before and after, frames, the menu's Rootweb, and a real-time capture with sound showing the full transition) are in `docs/screenshots/v60/`.

The structure is unchanged: the title, its heartbeat, a key, the transition, then the menu with its live scenes. Audio, input, the menu itself, the scenes' rotation and the updater work as before.

## What was found

| Question | Answer |
|---|---|
| Did the title's vines use the game's Rootweb art? | No. v59 drew them from nothing: Bézier tendrils filled with one gradient, flat membranes between them, and a plain plum gradient behind. That plain ground is what read as a purple screen. |
| Where did the menu's low-quality Rootweb come from? | Timing. The first scene is built under the title, often before the painted Rootweb art (`art/plant/rootweb/cells.png`) has loaded, so it was painted with the plain look used without the art (square tile edges, bright outline). When the art arrived, the game repainted only a running game, and the menu's world is deliberately kept apart from the game, so the scene kept the plain look until the next scene. Later scenes were already painted properly. |
| Did the menu bypass the painted-art path? | No. The scenes use the game's own renderer and the same quality setting. Only that first repaint was missed. |
| How was the transition drawn? | As filled canvas shapes, every frame. |
| How did the heartbeat move the Bloom? | The Bloom is redrawn in 14 rings, each drawn smaller towards its centre. All rings moved together. |

## The menu's Rootweb

- A scene built before the painted art loads is now repainted with it when the art arrives, exactly as a game is.
- The repaint is spread over the title's frames, a few milliseconds each, so the title never stutters and the menu's first frame is already finished. On this machine it is done within about three seconds of the title appearing.
- With a graphics card, the scene switches to the graphics card's Rootweb in the same step, as a game does.
- While the title peels back, painting keeps to its small per-frame budget.
- The scenes stay live worlds run by the game's own simulation. Nothing about them changed but the repaint.

## The transition

Still two seconds on the wall clock: covered by 0.85 s, the menu put underneath at 0.9 s, torn open from 1.05 s, gone by 2.05 s.

- **The membrane:** a living surface, painted once while the title waits. It has cloudy depth, the Rootweb's own cell texture in two layers, overlapping lobes of tissue with dark creases, meandering veins in grooves (the thick ones carry turquoise channels with nutrient light flowing along them), nodules with a wet highlight, fungal buds and sheen.
- **How it spreads:** it follows the tendrils in and creeps from the edges, with a ragged, lobed front that is lit and wet, and casts a shadow ahead of it onto the title.
- **The tear:** it opens from the middle outwards with a ragged, lit edge.
- **The tendrils:** large, translucent living limbs, shaded round with a dark underside, a lit flank, a broken wet highlight and a thin rim of light. A darker fleshy core shows through the outer tissue, with fine vessels in it. Two turquoise channels weave inside, with beads of light flowing in towards the living tip.
- **Not Vines:** no tube walls, arrows or even stripes. The light moves as irregular beads.
- **Variety:** seven tendrils (five on a narrow screen), each with its own width (up to about 1.7 times another's), pace, start, bend, wobble and swelling, and one to three side shoots that bud once the tip has passed. They grow in at staggered, shuffled times and peel back at their own pace, the shoots first.
- **A lighter version:** on Low quality, or on a computer whose title draws below about 28 frames a second, there is one channel per tendril, one shoot, no glow strokes and no cast shadow, on a coarser canvas. It keeps the same structure.

## The heartbeat

The timing is unchanged: every 5 to 8 seconds, a lub and a stronger dub. The response now travels through the organism:

1. The heart tightens and brightens.
2. The outer Bloom and petals follow about 70 ms later, each ring a moment after the one inside it.
3. The filaments and conduits round the Bloom brighten a moment after each beat, the second time more.
4. The wave along the conduits is stronger after the dub than after the lub.
5. The heart's light settles slowly after the second beat.

Nothing else on the screen moves or brightens.

## The menu over its scene

- The panel is a little more solid at its right edge, and its shadow falls further onto the scene.
- The scene is shaded beside the panel and under the footer. The rest keeps its colour and motion.
- The descriptions are a little brighter, with a faint shadow. Over the brightest possible scene they keep a contrast of 6.5 to 1.

## Performance

Measured on this build machine, which has no graphics card, so everything is drawn in software. On a computer with a graphics card all of it costs far less.

| | v59 | v60 |
|---|---|---|
| Transition, frames a second in the browser (`tests/xtest60.js`, three runs each) | 23 to 29 | 21 to 26 (the lighter version, which this machine gets) |
| Transition, the full version forced on this machine | | 11 to 15 |
| Painting the membrane, once while the title waits | | under 10 ms |
| Desktop app, live calm scene, processor | 64% | 60% |
| Desktop app, live battle scene, processor | 69% | 66% |
| Desktop app, still menu, processor | 2.5% | 3.5% |
| Desktop app, memory | 1,211 MB | 1,171 MB |

- **The transition:** the title itself draws at only 13 to 14 frames a second here, so this machine gets the lighter version, about 10% below v59. A computer that draws the title at 28 frames a second or more gets the full version. Its script work is about 2.6 ms a frame, against 0.7 ms in v59.
- **The menu:** the repaint and the shading cost nothing measurable. The figures are within the usual spread between runs (`tests/elperf60.json`).
- **The heartbeat:** each ring now looks up the beat at its own moment, a handful of sums a frame.
- **Moving menu background off** still means no world and nothing stepping (checked by `tests/xtest59.js` and `tests/elmenu59.js`).

## Tests

- `tests/xtest60.js` (new, 20 checks) covers this pass. See `tests/README.md`.
- `tests/xtest59.js` (45 checks), `xtest55.js`, `xtest56.js` and `xtest57.js` pass unchanged.
- `tests/elmenu59.js` passes in the packaged Linux app. It now reads the expected version from `electron/package.json`.
- The gameplay regressions (`lcquick`, `lcskir`, `lcstory`, `lcheld`, `lcsave`, `lctest`, `lcart`, `lcbloom`, `lchd`, `lcspit`, `lcweb`) give the same results as on v59, run side by side, apart from the run-to-run differences of their unseeded games. Opened from `file://`, both versions report the same cross-origin canvas warnings.
- `xtest55.js` failed once in four runs, then passed three times; nothing it covers changed.
