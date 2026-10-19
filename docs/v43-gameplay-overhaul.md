# v43: construction, logistics and enemy AI overhaul

v43 changes how the hive builds and how the HDF attacks. Six systems, all in the one game file (`index.html`), with no change to the art.

1. Rootweb grows round exposed ore instead of over it.
2. Root Taps and Deep Roots grow on ore outside the Rootweb; vines may run 5 tiles past it.
3. Every placed growth is paid for at once and then grows on its own for its growth time.
4. Dragging a Vine or Swift Vine plans the route live (bends, obstacles, budget, reach), with a Ctrl staircase and Esc to cancel.
5. Enemy waves share a cached route field, use gaps instead of chewing walls, take role-based targets and objectives, and hold their targets.
6. Holding Alt shows a fine grid over every tile you could physically build on.

## Research: how Mindustry does it

Read from the Mindustry source (Anuken/Mindustry, GPLv3, commit 84fd6bf, 19 October 2026). Only the ideas are used here; no code was copied, and the implementation is our own.

| Area | Mindustry | What v43 takes from it |
|---|---|---|
| Drag placement | `InputHandler` snaps a normal drag to a straight line. With the diagonal key (Left Ctrl) a conveyor drag runs `Placement.astar`: 4-neighbour A* with a Manhattan heuristic, a heavy turn penalty and a node cap, routing round blocks and falling back to a straight line; other blocks get a Bresenham 4-connected stair-step. Each conveyor faces the next. Crossings become junctions, gaps become bridges. | A bounded A* route for every vine drag (not only with Ctrl), with a turn cost so routes keep few bends, a small cost off the Rootweb, a node cap and a straight-line fallback. Ctrl drops the turn cost and adds a cost for straying from the straight line, which gives a stair-step. Every vine faces the next. Crossings are refused rather than turned into Vine Knots automatically. |
| Construction | `Build.beginPlace` puts down a `ConstructBlock`; builders add progress each tick and pull the items in gradually, so building stalls when the core runs short. Deconstruction refunds half. Progress is saved. | No builders: the swarm grows its own structures. Cost is paid in full up front (no stalls part-way), the site grows over a fixed time, and progress is saved. Reabsorbing refunds the full cost, as it always has in Last Colony, so a site cancelled at any point gives back exactly what it took. |
| Pathfinding | `Pathfinder` keeps one cached flow field per team, cost type and target. Enemy buildings are passable at a cost that grows with health, so a wave goes through weak walls and round strong ones. Fields are recomputed on tile changes, time-sliced and capped at about 10 per second. Units step to the cheapest neighbour; avoidance only kicks in when stuck. | The existing shared route field (Dijkstra to the Bloom, our walls costed by health) stays the backbone. It is now rebuilt at most four times a second however many structures change, and a unit only leaves it for a short local A* to a nearby objective. Stall detection and a sidestep when stuck. |
| Targeting | `AIController` retargets on a timer (with a random offset), at once when the target dies; `Units.bestTarget` sorts by unit first, building priority, then distance. Turrets keep a target until it is invalid. `Predict.intercept` leads moving targets. | Role weights decide which structure a unit wants (scouts: logistics; siege: guns; bombers: never walls). A target is kept until it dies or leaves range, and only after 1.5 s is it swapped, and only for one scoring under 70% of it. Lead aim (`leadAim`, already in the game) is unchanged. |

## The rules as built

### Rootweb and ore

- New Rootweb is never laid on an ore tile, from the Bloom's first patch onwards and from every Rootweb Node. It grows round each vein, so the crystals stay open.
- An ore tile inside a source's reach that touches Rootweb is the hive's ground: you can build there as if it were Rootweb, and it counts as Rootweb for the vine reach. Ore out on bare ground is not.
- Saves from before v43 that already have Rootweb on ore load with it untouched; nothing is deleted.

### Extractors and the vine reach

- Root Taps and Deep Roots grow on compatible ore with or without Rootweb (a Root Tap still cannot take titanium). They push their ore only into the growths beside them, which off the Rootweb can only be vines.
- Vines, Swift Vines and Vine Knots may run up to 5 tiles past the hive's ground. The count follows the shortest chain of vine tiles touching edge to edge: the first tile off the Rootweb is 1, tile 5 is allowed, tile 6 is refused with "Too far from Rootweb: vines reach 5 tiles past it (this would be tile 6)".
- Branches, loops, junctions and extractors never restart the count. Re-entering Rootweb does.
- A vine off the Rootweb must join it, or join a vine that does ("Vines past the Rootweb must join it, or join a vine that does"). A drag is judged as a whole, so a route can be planned out from the Rootweb in one go.
- Vines cut off from the Rootweb stay and keep carrying, but give no reach for new vines.

### Timed growth

- Placing pays the full cost at once. The site reserves its tiles, starts at a tenth of its health and gains the rest as it grows. It can be damaged and destroyed; destroyed sites refund nothing.
- A site does nothing: no gathering, carrying, vigor, Rootweb, firing, healing or hatching, and a growing gate is shut to everyone. It takes no items. Healing Pods do not mend it (so a cheap site cannot be propped up as a wall).
- Reabsorbing a site, or a grown structure, returns its full cost (capped by the Bloom's storage as before). Paid once, refunded once, so nothing is ever created.
- Selecting a site shows "Growing %", "Ready in" and that it will not work until grown.
- Growth times (seconds): Vine 0.5, Swift Vine 0.8, Vine Knot 0.8, Splitter Bulb 1, Sorting Gland 1.2, Bark Wall 1.5, Petal Gate 2.5, Ironbark 3, Thorn Spitter 3, Sunleaf 3, Rootweb Node 3, Root Tap 4, Sap Burner 4, Healing Pod 4, Seed Mortar 4, Great Bark 5, Deep Root 6, Spore Flak 7, Maw Gate 7, Spore Bellows 7, Spawning Pod 7, Resin Gland 8, Chitin Vat 8, Sunlance 10, Brood Chamber 12. Short for the tutorial's first growths (the Thorn Spitter it waits for takes 3 s).
- A dragged line grows in construction order, nearest the Rootweb first, each tile starting 0.12 s after the one before.
- Pre-placed and story structures, HDF structures, the Test Range and everything in an older save are complete.
- The site fields (`bt`, `built`) are ordinary block fields and save with the game.

### Vine route planning

- The route is a bounded A* over the tiles round the drag (6 tiles of margin, 9000 states, 240 tiles at most). Rock, water, the drop zone and other growths are obstacles. An existing vine can be run along (upgrading it to a Swift Vine, or turning it round) but not turned on or crossed side-on; a Vine Knot can be passed straight through. A press or release on anything else is left alone, so a drag ending on the side of a vine stops beside it, feeding into it.
- Ctrl drops the turn cost and costs straying from the straight line, giving a staircase. Ctrl is read every frame, so pressing or releasing it part-way changes the preview and the result.
- The preview shows every tile with its verdict (green, orange for not affordable, red for blocked or out of reach), arrows, reach numbers off the Rootweb (5 in gold, a cross past it), small construction-order numbers, and a label with the count, total cost and what cannot be placed.
- Affordability: tiles are paid for in construction order and as many as the Bloom can pay for are placed; the rest are reported as not affordable. Refused tiles are never charged.
- Esc during a drag cancels it: nothing placed, nothing paid.

### Enemy AI

- One route field per map to the Bloom, our solid structures costed at 10000 plus health/25, rebuilt when structures appear, finish growing (gates) or fall, at most every 0.25 s.
- While the route field has an open way to the Bloom, Scout Tanks, Flame Tanks and Rammer Drones do not target bark walls. When it has none (they are sealed out) or a wall is the next tile on their route, the wall is a real blocker and they break it.
- Roles: Scout Tank (logistics, extractors and sites first; leaves the route for one within 9 tiles), Flame Tank (any living non-wall growth; objectives within 7 tiles), Siege Tank (spitters, then other growths, the Bloom, bark last), Rammer Drone (rams blockers), Bomber (never bark; sites, extractors and logistics first), Interceptor (ants first, then supply lines).
- Objectives are taken only when a short ground route (700 nodes) reaches them without breaking through any other structure. A unit gives up an objective it cannot reach and goes back to the route field.
- Target commitment: a target is kept while alive and in range; it is swapped only after 1.5 s, and only for one scoring under 70% of it.
- A unit that has not moved for 2 s with nothing in range attacks the structure pressing on it or sidesteps.
- Story-scripted units (the Landfall patrol and its first contact, and any other scripted scene) return before any of this runs.
- F4 shows the route debug view; it is off by default.

### Alt grid

- Fine translucent outlines on every visible tile that is inside the map, not rock or deep water, with no structure or site on it and seen (with fog of war on). Ore stays gridded. Being off the Rootweb or beyond the vine reach does not hide a tile; the placement preview says that.

## Controls added

| Key | What it does |
|---|---|
| Drag (Vine, Swift Vine) | Plans the route live and places it on release |
| Ctrl + drag | Staircase of orthogonal vines along the diagonal |
| Esc during a drag | Cancels the drag |
| Hold Alt | Buildable-ground grid |
| F4 | Enemy route debug view |

The in-game help line and the Game Guide (Growing, Vine reach, Building controls, How the HDF attack) describe them.

## Tests and performance

### New checks

`tests/xtest43.js`: 71 checks, 71 passed (headless Chromium). They cover the ore-safe Rootweb, off-web Root Taps, the 5-tile vine reach (tile 5 placed, tile 6 refused, branches and loops do not reset it), drag routing, Ctrl staircase, Esc cancel, affordability (refused tiles never charged), timed growth, refunds, saving a half-grown site, enemies using gaps and breaking walls only when sealed out, target hysteresis, F4 and the Alt grid. The packaged Windows app was also run in Electron 33.2.1: the 6th vine was refused, a Root Tap grew off the Rootweb, Alt and F4 worked and a 12-unit wave ran with no page errors.

Screenshots are in `docs/screenshots/v43/`.

### Regression (36 suites)

- Same result as v42: lcquick, lcskir, lcstory, lcheld, lcsave, lctest, lcweb, lchd, qtest, wbtest, vtest, ncheck, nstory, gpuapp, mtest, oldsave, btest, dtest, lcbloom, xtest37, and art on/off identity.
- Already failing in v42: lcspit. lcart's fallback map is unseeded and placed 3 of 4 nests on this run.
- Expected differences: tests that compare exact game states with earlier builds (ident37 to ident42, otest, xtest38, xtest40, xtest41, xtest42) now differ because growths start as sites, the Rootweb skips ore and the enemy AI changed.
- With growth made instant (to isolate the other changes): xtest41 matches v42 exactly; xtest40 keeps 1 difference (the Test Range arena fight) and xtest42 keeps 4 (flak, mortar and Sunlance combat checks). Those come from the new enemy targeting and movement, which is the intended change. The ore-safe Rootweb's effect on xtest38, otest and the ident tests was not isolated.

### Performance (headless Chromium, same seed)

Simulation cost per step, walled base with 12 guns, 900 steps:

| Enemies | v42 mean / p90 (ms) | v43 mean / p90 (ms) | Route field rebuilds (v43, 30 s) |
|---|---|---|---|
| 40 | 0.35 / 0.6 | 0.51 / 0.8 | 16 |
| 100 | 0.43 / 0.7 | 0.49 / 0.7 | 35 |
| 160 | 0.56 / 0.9 | 0.71 / 1.1 | 43 |

Vine route planner plus evaluation, per call: 0.3 to 2.1 ms for drags of 20 to 120 tiles, with 0, 500 or 1453 vines already grown (the map held 1453 of the 2000 asked for). Reach count: 0.01 to 0.2 ms. It is cached, so it runs only when the drag end changes.

Median frame render at 1280x800: 10.5 ms plain, 9.8 ms with a 60-tile drag preview, 9.6 ms with the Alt grid, 11.9 ms with the F4 debug view.
