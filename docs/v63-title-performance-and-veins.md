# v63: the title's heartbeat on Windows, connected construction veins, and a new transition

The pictures are in `docs/screenshots/v63/`. The two videos (frames drawn on the game clock at 30 a second, so they play at true speed):
`construction-veins.mp4` and `title-and-transition.mp4` in the project files (`v63/`).

None of it touches the game: no items, supply, build time, balance or save data. The title, menu, sound, settings, saves and the
updater work as before.

## 1. The title heartbeat (the reported slideshow)

### What was slow

Every Bloom beat on the title starts two waves of light along the conduits. Up to v62, each wave was drawn by making **two new
canvases the size of the screen** (a mask and a glow), filling them and compositing them, every frame while the wave ran. A beat
keeps two waves alive for about two seconds, so on a 1080p screen that is about 16 million new pixels a frame, and on a high-DPI
screen (the title draws at up to 1.5× there) more than twice that. On a GPU that handles it the cost hides; where Chromium falls back
to drawing canvases in software, or a driver struggles with large new textures, every beat frame takes hundreds of milliseconds.

Measured here (Chromium, software drawing, 1920×1080 CSS pixels; time inside `splashDraw` per frame):

| | 1× screen, beat frames | 2× screen, beat frames | frames at rest |
| --- | --- | --- | --- |
| v62 (current release), High | — | avg 195 ms, p95 224, worst 249 | 0.6 ms |
| v62, Epic | avg 83 ms, p95 113, worst 137 | avg 193 ms, p95 281, worst 283 | 0.6 ms |
| v62, Medium | — | avg 193 ms, p95 219, worst 221 | — |
| **v63**, Epic | **avg 4.3 ms, p95 5.9, worst 8.0** | **avg 4.0 ms, p95 5.0, worst 5.3** | 0.5 ms |

Time between frames shown during a beat (all drawing, including the browser's own compositing in software): v62 Epic 1× average
114 ms (worst 178), 2× average 266 ms (worst 376); v63 Epic 1× average 60 ms (worst 97), 2× average 112 ms (worst 172). Frames at rest
take the same in both. In v62 the beat was the only thing slowing the title; in v63 a beat costs about what a frame at rest does.

The title's cost does not depend on the graphics preset: Low only lightens it a little, and Medium, High and Epic draw the title
the same way. In the game itself the beat adds nothing measurable on any preset (`game.js` profile below). Epic is slower overall on a
high-DPI screen because it draws the game at full resolution: 3840×2160 against High's 2880×1620 on a 2× screen, about 1.8× the
pixels, on every frame.

### The fix

- All waves now share **one small mask** (640 px wide, made once): each wave is a soft ring drawn into it with `lighter`, then the glow
  picture is laid through it once. The glow is soft, so the smaller mask looks the same. A beat makes **no new canvases** (checked by
  `xtest63` #14, which counts them).
- The title's frame loop asks for the next frame first, then draws, takes the game's frame limit into account (Unlimited is held to
  240 a second on the title) and clamps a long gap to a quarter of a second, so a stall can never stretch the animation out.
- The Bloom's warp on a beat reads from a cached 880×880 picture instead of the full background.
- The title draws at the screen's resolution up to 1.5× (as before), never larger than its picture needs.

### What could not be checked here

This machine has no Windows and no GPU. The fix removes the per-beat full-screen canvases, which were the only thing in the title
that grew with each beat, and the beat now costs the same as a frame at rest. Whether that was the whole cause on the affected
Windows machine can only be confirmed there. So the desktop app now writes **`lc-log.txt`** in its user-data folder
(`%APPDATA%\Last Colony\` on Windows) each launch: the version, Windows and Electron versions, whether the frame limit is lifted,
what Chromium reports about the graphics card (`app.getGPUFeatureStatus()`: software fallbacks show as `disabled_software` or
`unavailable_software`), and every warning the game logs, including a slow title frame. If the title is still slow on that
machine, this file says which.

## 2. One vein material for the network, the feeders and the transition

The links the Rootweb painter draws between the Bloom and its Nodes (`webChanBuild`) are the design source. `veinBody` draws that
material: a dark furrow, a translucent wet violet skin, a darker core seen through it, the turquoise nutrient channel with its glow, a
pale wet lumen, a broken highlight, small nodules and rootlets into the membrane. It is used for:

- the links of the supply network (the same lines as the painted channels; where a painted channel would cross a real gap, the link runs
  over fed Rootweb instead);
- the temporary branch into a growth being grown;
- the title transition's tendrils, drawn large (`big`: extra shading round the limb in thin layers, and the channel, lumen and highlight
  following the limb's own width), with the Rootweb's cell texture and a soft mottling laid into the skin;
- the veins in the transition's membrane.

With painted art off, the same procedural material is drawn (it needs no pictures); the cell texture is simply left out.

## 3. Construction: a connected vein from the Bloom Heart into the growth

- **The network** (`circNet`, rebuilt only when the fed Rootweb, the Bloom, or the set of hubs changes; hubs are scanned every 0.25 s):
  hubs are the Bloom, Rootweb Nodes and Spore Bellows. Each hub is linked back towards the Bloom by its painted channel. A link counts
  only while it lies on fed Rootweb (or the colony's growths), stepping over at most a hole of about two tiles, never rock or water,
  and only if both ends touch fed Rootweb. A hub's chain is the links from the Bloom to it.
- **The route** to a growth (`circSiteRoute`): a flood over fed Rootweb from every linked hub at once finds the nearest one; the route is
  that hub's chain of links from the Bloom, then a new branch over fed Rootweb from the hub to an intake **inside** the growth (the centre
  of a 1×1, a point inside a larger one on the side the route comes from). Straight runs are pulled tight only where the straight line
  stays on fed Rootweb; the gentle bow and the smoothing never push a point off it (v63 final: a bowed point that would leave the Rootweb
  bows less or not at all, and a smoothed corner that would cut across bare ground is kept).
- Growths **share** the links upstream: two growths beyond Node 3 both run Bloom → Node 1 → Node 2 → Node 3 and only split there.
- A Spawning Pod uses its own link from its hub (its special placement rule), a Root Tap off the Rootweb gets no route.
- **No supply, no route**: if the Rootweb between a growth and the Bloom is broken, the links beyond the gap stop counting and the
  growth shows only a dull stub that carries nothing, and no lights. Note: the game's own rule counts all the Rootweb inside the Bloom's
  reach as fed even across a gap, so such a growth may keep growing; the veins show only a route that physically exists. Its rules are
  not changed.
- **Finished**: the branch dulls and fades over about 1.6 s (0.6 s if the growth is destroyed); the links stay.
- Routes are recomputed only on a topology change (a new supply flood, a growth started, finished or lost, a hub planted, finished or
  lost, a save loaded, a new map); a light whose route lost a link is removed at once.

## 4. The heartbeat pumps packets along the routes

The double beat and its 7 to 10 s rest in play are unchanged. On each beat a small packet of the existing turquoise lights leaves the
Bloom: at least 60% of it goes down routes to growths being grown (shared between them), the rest down a few healthy branches. A
growth being grown also gets a steady stream that eases in and out. Every light starts at the Bloom's chamber and runs along its route's
links in order, then the branch, into the growth, where it brightens the intake. Budget: 24 / 48 / 72 / 90 lights (Low to Epic), 60% of
that when zoomed far out; the steady streams share a fixed total. Lights only move on the game clock (a paused game holds still), are
drawn only when on screen, and are removed when they arrive or their route is cut. Reduced motion keeps the feeders and drops the beat
and the lights.

## 5. The title-to-menu transition

Seven large tendrils (five on a narrow screen) grow in from the edges, each with one to three side shoots, crossing near the middle,
while the textured membrane (cloudy depth, the Rootweb's cells in two layers, veins in the vein material with flowing nutrient, folds,
nodules, sheen) unfolds between them, led by the tendrils, then tears open from the middle onto the menu. It is never a flat screen of
colour. About 2.05 s in all; a second key at any moment goes straight to the menu.

Each tendril is painted **once**, while the title waits, into a picture of its own (14 pictures at 1080p; about 25 ms, plus 20 to 60 ms
for the membrane). Each frame uncovers each picture along its length through one short clipping path (narrowing to a living point, its
rootlets following), adds a glow at the tip and five lights running down its channel. Its own drawing costs about 1 to 2 ms a frame
(1080p: average 1.1 ms, worst 5.4; 2× screen: average 1.9 ms, worst 6.4), the same as v62's flat tendrils (average 1.5 ms). It is
drawn at the screen's resolution (up to 1×; 0.75× on Low or a slow computer), sharper than v62's 0.7×.

## 6. The menu

The live menu scenes use the game's own renderer and painted Rootweb. They were drawn at 60% of the screen's resolution; they now
start at **full resolution**, and only a computer that cannot keep up gets three quarters, then 60% (the old setting), and only then
still pictures. Everything else (scenes, sound, the moving-background switch, controls) is unchanged.

## Checks

- `tests/xtest63.js` (new), all pass, three runs in a row: a route from the Bloom through three Nodes; it starts at the Bloom's
  chamber and ends inside the growth; one continuous line; the branch and links stay on fed Rootweb; shared upstream links; lights start
  at the Bloom, only move forward, mostly go to growths and never pass the cap; close-ups at three zooms; save and load mid-growth; a
  four-tile Rootweb break (no route, no lights, no light on a dead link) and its repair by a Node planted in the gap; a finished growth's
  branch fading; every quality preset and painted art off within the caps; 20 s of drawing leaves the whole save identical; the title at
  1× and 2× (no new canvases on a beat, beat frames p95 5.5 ms at 1080p and 5.4 ms at 2×); the transition prepared beforehand, over in about
  two seconds, a second key skipping it (also with painted art off); the menu starting at full resolution.
- `xtest61` (41 checks) and `xtest62`: all pass.
- `lcquick`, `lcbloom`, `lcsave`, `lcart`, `lcweb`, `lcskir`: the same as the current release run side by side, apart from the run-to-run
  differences of their unseeded games; both builds give the same cross-origin canvas warnings from `file://`.

Profiling scripts used for the numbers above (not part of the test suite): the title profile wraps `splashDraw`, `hbWarp` and
`vineTick` and records their time and the gaps between frames over 10 to 14 s with at least one beat, then presses a key; the game
profile wraps `render` for 20 to 24 s of a running Survival game and splits frames by whether the Bloom is beating.
