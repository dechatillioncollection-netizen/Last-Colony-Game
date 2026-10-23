# v61: the colony's circulation

The pictures and a real-time recording are in `docs/screenshots/v61/`. The recording shows idle beats, then one growth from planting to completion and fade, then several growths, then a cut in the Rootweb and its mending.

This is for looks only. Nutrient economics, costs, build times, construction, placement, Rootweb connectivity, combat and saves are unchanged.

## What was found

| Question | Answer |
|---|---|
| How was the in-game Bloom animated? | Painted layers (`ART.plant.core`): roots and root pulses, two rings of petals (under the buildings), then the collar, fluid, floating core, membrane, glass, highlight and stinger. The chamber layers (`g:'dome'`) share a slow breathing scale, the petals a slow grow and sway, and the membrane a slow pulse. There was no heartbeat in play; only the title had one. |
| And without the painted art? | A drawn Bloom whose whole heart sprite swells slowly (`drawBlockHD`). |
| What is connected? | Supply floods from the Bloom over Rootweb, eight ways (`webSupply`, `WSUP.live`). It is worked out again only when the Rootweb changes. Rootweb Nodes spread Rootweb but feed nothing themselves; there is one Bloom. |
| What is being built? | A growth is a site while `b.bt` is set and `b.built` is below 1. A short negative `built` is the wait before it starts. Vines, Swift Vines and Vine Knots are sites too. |
| What may stand off the Rootweb? | Root Taps and Deep Roots on ore beyond it (`placeCheck`), and Vines. A growth on Rootweb that has since been cut off also stands unfed. |
| What lights were there already? | The painted Rootweb's own pulses (`webArtFx`): little glints that run along its channels at random. They were neither tied to the Bloom nor routed anywhere. |

## The beat

Every 7 to 10 seconds the Bloom beats twice and rests. This is the title's rhythm, slower so it does not distract.

1. The chamber (fluid, core, membrane, glass, highlight) tightens by up to about 6%, and a soft glow brightens over the heart.
2. The petals follow about 70 ms later, by about 2%.
3. The membrane's veins flare, up to about twice as bright, and settle slowly.
4. A second, softer beat follows 0.2 to 0.3 s later, then the long rest.

The collar, roots, stinger, footprint, selection box and the Bloom's aim never move. Without the painted art, the drawn Bloom's heart tightens instead. The beat is silent.

## Lights

The lights are small turquoise points of the Rootweb's own colour.

- **Each beat** pumps a few lights out of the edge of the Bloom's chamber. On High that is 6 for the first beat and 4 for the second while growths are being grown, or 4 and 3 with none (fewer on lower qualities, more on Epic). The lights follow the Rootweb tiles the Bloom actually feeds, from tile to tile, smoothed. Each takes up to about four seconds to reach the end of its way, so the pulse is seen travelling outwards and is never a flash.
- **While growths are being grown**, about 60% of each burst goes to them, shared in turn. The rest goes down a few healthy branches: the furthest fed tile within 16 steps in each of eight directions.
- **With nothing being grown**, all of each burst goes down those branches, a restrained trickle.
- **A growth being grown** also gets a steady stream. It eases in over 0.8 s and out over 1.2 s when the growth is done. On High it is about 2.2 lights a second. All streams together never exceed 7 a second, so several growths share it.
- When a light reaches a growth, the growth's tissue brightens a little.

## Feeding tendrils

Every growth being grown that the fed Rootweb reaches gets one feeding tendril.

- **Where it rises:** it rises from the fed Rootweb tile nearest the Bloom under the growth or within two tiles of it. It comes up out of a soft swelling with rootlets.
- **Shape:** it reaches into the growth, bowed to one side and tapering.
- **Look:** it has a translucent outer membrane, an opaque violet body with a dark core and a turquoise channel, a broken wet highlight and two nodules.
- **Light inside:** it swells where a light passes inside it.
- **Entering:** the part inside the growth is drawn again over the growth, ending in a soft mouth where the light pools.
- **Completion:** the feeder dulls to the Rootweb's own violet and fades over 1.6 s. The Rootweb itself is not touched.

It is not a Vine: it has no walls, arrows or even stripes, and the light in it moves as separate lights.

## Exceptions, cuts and mending

- **A growth the fed Rootweb does not reach** gets no lights and no route. This covers a Root Tap or Deep Root on ore beyond the Rootweb, and a growth cut off from the Bloom. If unfed Rootweb lies beside it, a short, dull grey-violet stub with no channel shows that it is rooted but not fed. Otherwise only its own growing roots show, as before. No path is ever drawn over ground the supply does not cross.
- **When the Rootweb is cut,** the routes are worked out again the moment the supply is. A light whose way ahead is no longer fed goes out, so no light crosses a cut. Growths beyond the cut lose their feeder and stream. The cut tissue dims as it always has.
- **When the Rootweb is mended,** routes, feeders and lights come back on the next supply update.
- **Origins:** only the player's Bloom sends lights. There is no other supplying Bloom in the game, and a light never jumps or doubles.

## How it is kept cheap

- **Routes:** worked out only when the supply flood changes or the set of growths changes. That is one breadth-first pass over the fed tiles, plus a route per growth and eight branches. Growths are checked four times a second; nothing else is recomputed per frame.
- **Lights:** one cached sprite, drawn additively, only on screen. Caps are 24, 48, 72 and 90 (Low to Epic), 60% of that zoomed out past 0.75.
- **Feeders:** the full sculpting needs the painted art, zoom 0.75 or closer, Medium or above and at most six growths at once. Otherwise each keeps its body, core and channel.
- **State:** all of it lives outside the game state, in fixed small lists that are cleared as lights arrive and feeders fade. It is keyed to the game it belongs to and starts afresh with a new game or a load. It is never saved.
- **Pause and motion:** it runs on the game clock, so a paused game holds still. Reduced motion keeps the feeders and drops the beat and the lights. A minimised window draws nothing, as before.

## Performance

Measured on this build machine, which has no graphics card, so everything is drawn in software. These are frames a second for a held game at zoom 1, in alternating 2.5 s windows: the game's own loop on a new random map each run, the median of 6 windows, three runs each. On a computer with a graphics card it all costs far less.

| Growths being grown | v60 | v61 | v61 with the circulation switched off |
|---|---|---|---|
| None | 49.9 (47.2 to 52.2) | 47.2 (46.8 to 51.4) | 49.6 (45.5 to 50.3) |
| 3 | 45.9 (45.6 to 47.8) | 49.1 (47.4 to 50.0) | 48.6 (47.0 to 50.4) |
| 16 at once | 44.2 (43.7 to 48.6) | 44.9 (44.7 to 48.8) | 44.0 (43.4 to 45.1) |

- **Within the spread:** the differences are no larger than the spread between runs. `tests/xtest61.js` checks the same each time it runs, at 90% or better with the circulation on than off.
- **Script work:** the per-frame work is about 0.02 ms of bookkeeping. Routes are worked out only on a Rootweb or growth change.
- **Desktop app:** the menu test (`tests/elmenu59.js`) passes in the packaged Linux app, with processor and memory as in v60 (calm scene 60%, battle scene 65%, still menu 3%, about 1.1 GB). The circulation is kept out of the menu's live scenes so the title transition's timing is untouched. In the desktop app it runs in a game: the beat, its bursts and a growth's route were seen there with no errors.

## Tests

- **`tests/xtest61.js` (new, 41 checks):** covers the brief's items 1 to 14. See `tests/README.md`.
- **`tests/xtest60.js`, `xtest59.js`, `xtest55.js`, `xtest56.js` and `xtest57.js`:** pass unchanged.
- **`tests/elmenu59.js`:** passes in the packaged Linux app, four runs in a row.
  - Before the circulation was kept out of the menu's scenes, two of four runs failed: once the transition ran long, and once another check failed. v60 passed three of three on the same machine.
- **The gameplay regressions** (`lcquick`, `lcskir`, `lcstory`, `lcheld`, `lcsave`, `lctest`, `lcart`, `lcbloom`, `lcweb`, `lchd`, `lcspit`): run side by side with v60, they give the same output, line for line in count and in their warnings. Opened from `file://`, both versions report the same cross-origin canvas warnings.
- **`oldsave.js`:** stops at the same place in both versions. It needs a copy of the v33 build in `previous/`, and its menu button no longer exists. It is not a v61 regression.
- **Not checked here:** Windows itself. The Windows installer is built by the release workflow, and only its files and the updater's view of the release were checked from here.
