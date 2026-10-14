# Last Colony: how the graphics work, and the painted art system

## How the current renderer works

- **Engine:** HTML5 Canvas 2D in a single `<canvas>`, plus (from v30) a WebGL 2 layer for the ground and the painted Rootweb, described under "GPU renderer" below. There is no game engine and no sprite sheets. Everything else is drawn with code every frame.
- **Tiles:** one tile is **24×24 world pixels**. A 2×2 building is 48×48, and a 3×3 building is 72×72. Building positions are whole tiles, so drawing always starts at `(tileX*24, tileY*24)`.
- **Camera:** one transform per frame (`setTransform`) handles pan and zoom (0.5× to 2.5×) and the screen's pixel density. Buildings are drawn in world pixels and the camera scales them.
- **Frame order:** the terrain comes first. It is painted once into a big offscreen canvas, and HD mode uses a 16 px/tile version. Next come the Rootweb overlay and soft shadows (HD only), then the Bloom. Then every building on screen is drawn, then the enemies and ants, then the bullets and effects. Off-screen buildings are skipped.
- **Building renderer:** one function, `drawBlock(type, x, y, rotation, building, time, team)`, draws every structure. It tries three looks in order:
  1. HD Remaster
  2. classic plant look
  3. classic metal look

  The game also reuses it to draw the build-menu icons, so icons always match the map.
- **Sprites today:** HD mode paints each building's shell once into a hidden canvas at 3× resolution and caches it. The moving parts are drawn on top each frame.
- **Animation:** there are no animation files. Motion comes from sine waves driven by the game clock: pulsing glows, spinning drill rotors, turret heads turning to their target angle, and the hatching ant growing as production progresses.
- **Simulation:** the game logic runs at a fixed 30 steps per second, separate from drawing. Changing how a building looks can't change how it plays.

## The simplest compatible addition (what was built)

The new art system adds one line at the top of `drawBlock`: "if this structure has finished painted art, draw that and stop". Otherwise the old drawing runs exactly as before. Nothing else in the game changes, including gameplay, sizes, costs, building rules, selection boxes, health bars, hit flashes and the construction fade.

- **Layers:** each structure is a stack of transparent PNGs. Every layer is a square image that covers the building's whole footprint, so alignment to the grid is automatic.
- **Fallback:** if any layer is missing or fails to load, that structure keeps its old look and a warning goes to the console. Structures can be converted one at a time.
- **Toggle:** Settings has a "Painted artwork (prototype)" checkbox to switch between old and new for comparison.
- **Performance:** when more than 60 painted structures are on screen, or you zoom out past 0.75×, each one is drawn as a single pre-combined image with no per-layer animation. Reduced-motion system settings also turn animation off. In testing with 150 pods, the painted version drew faster than the old procedural pod.
- **Turrets have three quality levels:**
  - **Full:** with up to 12 painted structures on screen, every layer moves.
  - **Middle:** with 13 to 60 on screen, the low-priority motion stops: individual petal sway, root pulses, the liquid sheen, the bending stalk and the ammo tips. The petals still tighten and the chamber still squeezes.
  - **Cheap:** above 60 on screen, or zoomed out past 0.75×, everything is baked except the twin thorns and the firing pulse, so the aim and the shots always stay visible.
- **Game state on top:** feedback that comes from game state stays drawn by code over the art. For the pod, that is the hatching ant and the green "ready" ring.

## Adding art for a structure

Folder: `art/plant/<name>/` for Pl-Ant Hive structures and `art/hdf/<name>/` for HDF structures. Then add an entry to the `ART` table in the game file. This is the Seed Pod's entry:

```js
nest:{name:'Seed Pod',dir:'plant/seed-pod/',dome:[.5,.484,.242],breathe:{amp:.018,period:4.2},
  layers:[{f:'base.png'},{f:'liquid.png',g:'dome'},{f:'seed.png',anim:'float',n:5,size:.2,g:'dome'},
    {f:'membrane.png',anim:'pulse',min:.35,max:.9,period:2.8,blend:'lighter',g:'dome'},
    {f:'glass.png',g:'dome'},{f:'highlight.png',anim:'shimmer',amp:.025,period:5,blend:'screen',g:'dome'}]}
```

**PNG rules**
- Transparent PNG, square, top-down view, light coming from the top-left.
- Use 128 px per tile: 128 for 1×1, 256 for 2×2, 384 for 3×3. Anything square works because it is scaled to the footprint.
- The image edge is the footprint edge. Keep important detail inside it. Roots that touch the middle of an edge will join up with the neighbouring building's roots.
- Only small "particle" sprites, such as the floating seed, use a different size (64×64 here).

**Layer animations available**

| anim | what it does | settings |
|---|---|---|
| (none) | static | |
| `pulse` | fades between two strengths | `min`, `max`, `period` (seconds) |
| `shimmer` | drifts slightly | `amp` (fraction of the building size), `period` |
| `float` | draws a small sprite several times, drifting inside the dome | `n`, `size` |
| `spin` | rotates continuously | `period` |
| `aim` | rotates to the turret's aim angle (for HDF guns) | |
| `blink` | on/off (warning lights) | `period` |
| `bob` | one small sprite floating near the dome centre (Bloom core) | `size`, `amp`, `period` |
| `petals` | `n` petal sprites around the centre, each swaying and stretching on its own | `n`, `off`, `len`, `wid`, `sway`, `grow`, `period` |
| `rootpulse` | a glow sprite travelling along the entry's `roots` curves, from the first point to the last | `size`, `period` |
| `twin` | turret only: draws a sprite on both thorns (`part:'thorn'` or `part:'tip'`, placed by `at:[x,length,height]`), or the stalk (`part:'stalk'`), turned to the game's aim angle | `part`, `at` |
| `shot` | turret only: the pressure pulse running to the thorn that just fired, then a small mist at its opening | `size` |

**Other settings**
- `g:'dome'` makes a layer breathe with the building's `breathe` setting, which scales it gently around the `dome` centre. `dome` is `[centre x, centre y, radius]` as fractions of the image.
- `blend` takes a canvas blend mode such as `lighter` or `screen`.
- `alpha` sets a fixed opacity.
- `lite:false` hides a layer in the cheap mode, and `far:false` hides it when zoomed far out.
- `pass:'under'` draws the layer before any building, so it sits beneath neighbours. The Bloom's roots and petals use this.
- `rect:[x,y,w,h]` crops a mostly empty layer once at load, so less is drawn each frame.
- Entry settings:
  - `pad` adds tiles of margin around the footprint. The Bloom uses 2, so its box is 7×7 tiles (896 px).
  - `priority:true` keeps full animation even when other structures are simplified.
  - `hurtShrink` shrinks the petals as health drops.
  - `weapon` holds the turret settings: thorn side offset, tip distance, recoil, chamber squeeze, sag with damage, petal tightening and stalk bend.
- More layer settings:
  - `ammo:<item>` shows a layer only while that ammo is loaded.
  - `lite:true` keeps a layer live in the cheap mode.

## Seed Pod prototype

- Uses six layers: `base` (lily pads, roots, fungal collar), `liquid`, `seed`, `membrane` (glowing veins), `glass` (pearl rim and reflections) and `highlight`. It has floating seeds, a pulsing membrane, a drifting liquid highlight and a slow breathing dome.
- The game has no separate "Seed Pod" building, so the art is shown on the **Spawning Pod** (2×2, available from the start). Moving it to another structure is a one-word change of the key in `ART`.
- The layers were painted procedurally. The script is `game/art-source/paint_seedpod.js`. Any of the six PNGs can be replaced with hand-made or AI-made art that follows the rules above, with no code change.

## Bloom

- **Footprint:** 3×3 tiles. The box is 7×7 tiles (896×896) with the footprint in the centre 384×384.
- **Under-pass layers:** roots, root pulses, outer petals and inner petals.
- **Building-pass layers:** collar, fluid, the floating core, membrane, glass, highlight, and the stinger, which aims where the Bloom spits.
- **Priority:** it always keeps full animation. Only the root pulses and the liquid sheen are dropped when zoomed out past 0.75×.
- **Damage:** petals shrink with damage, as the old Bloom's did.
- **Painter script:** `game/art-source/paint_bloom.js`. It also outputs the root curves the pulses follow.

## Thorn Spitter

- **What the game does (checked in the code before painting):**
  - The footprint is 1×1 tile (24 px), with 110 health. It needs Rootweb and costs 35 copper.
  - Range is 8.5 tiles, against ground and air.
  - It turns at up to 10 radians per second and fires only when lined up within about 14°.
  - It shoots two thorns **alternately**, one every 0.32 s, from points 0.18 tiles either side of the centre line.
  - Each ammo is different:
    - copper: 9 damage, speed 14;
    - resin: 18 damage, speed 14;
    - chitin: 13 damage, speed 16, and it reloads 25% faster.
- **Footprint:** box 2×2 tiles (256×256) with `pad:.5`. The tile itself is the centre 128×128.
- **Under pass:** roots and nutrient pulses. These reach a little past the tile, so neighbouring buildings always draw on top of them.
- **Building pass:** five petals, the socket, the turquoise chamber and its membrane, then the two pressure channels. On top come the twin thorns, the loaded-ammo tips and the firing pulse.
- **Aim:**
  - The thorns turn to the game's own aim angle, and the base never rotates.
  - The stalk leans towards the target ahead of the thorns, so turning looks like bending.
  - Each thorn sits exactly where the game spawns its shot.
- **Firing:**
  - Driven only by real shots. The game now records `b.shot`, the time of the last shot, and `b.rr` already says which thorn fired.
  - On each shot the chamber squeezes, a pulse runs to that thorn, the thorn recoils and a small mist leaves its opening. Then the chamber refills.
- **Shots:** with painted art on, a Thorn Spitter shot is drawn as a small thorn tinted by its ammo:
  - copper: muted copper;
  - resin: glossy amber;
  - chitin: dark with a pale edge.

  It stays hidden until it passes the thorn's opening. Speed, damage and hit detection are unchanged.
- **Damage:**
  - The petals flinch when it is hit, and the chamber sags as health drops.
  - The hit flash and health bar are unchanged.
- **Painter script:** `game/art-source/paint_spitter.js`.

## Living Rootweb

The Rootweb is not a building, so it does not use the layer system above. Its textures feed a painter that runs inside the game.

- **What the game does (checked in the code before painting):**
  - Coverage is one byte per tile (`G.web`). It spreads tile by tile from the Bloom, Rootweb Nodes and other sources, and the Spore Bellows double the rate. Total cover is capped at 30% of the map.
  - Ore tiles can be covered. Rock and water never can.
  - The visuals read that byte array and never write it. Nothing visual goes into saves.
- **How it is drawn:**
  - Each tile is painted once into a cached layer, and again only when something changes: the tile or a neighbour gains or loses Rootweb, a growth is planted or removed nearby, or a new tile reaches its next growth stage.
  - The layer is split into 8×8-tile chunks, so a repaint only touches one small canvas.
  - Nothing is painted inside the simulation step. New tiles, their growth stages and neighbour repaints all share one small budget per frame (about 1.6 ms). If growth outruns it, a tile skips straight to its current stage, so fast spreading can't drag the frame rate down.
  - Whole repaints after loading a save or switching the look paint the screen first and the rest over the next frames.
- **Edges:**
  - The outline comes from a soft coverage field: the covered tiles blurred slightly, then pushed inward by slow noise. It follows the colony's shape instead of the grid.
  - Paint never reaches past a covered tile. The tests check every pixel of every uncovered tile.
  - Wide areas can be eaten into further than one-tile strips, so corridors keep a continuous thread of membrane.
  - Thin tendrils and small fungal buds fill the margin between the membrane and the edge of the covered ground.
- **Membrane:**
  - Dark violet/magenta and translucent, with a soft wet rim.
  - Veins come at three scales. They are warped so they meander, and the fine capillaries only appear in patches.
  - On top sit moist sheen, fungal tissue and small nodules.
  - The membrane fades softly over ore, with no hard square, so the crystals stay readable.
- **Connections:**
  - The Bloom has nine thick feeder spokes. Pods and other growths have five, and Thorn Spitters have four.
  - Curved channels run from the Bloom (or the nearest Node or Bellows closer to the Bloom) out to each Spawning Pod. Nodes and Bellows are linked back towards the Bloom the same way.
  - Channels are thick at the Bloom and taper towards the growth they feed. They only show where there is membrane.
- **Growth, synced to the real spread:**
  - A newly covered tile shows tendrils first.
  - Then membrane fills in from the sides it shares with covered ground, which is why there is never a seam.
  - Then the veins fade in, and it reaches its full look at about 1.1 seconds. That is three paints per tile in all.
- **Motion (at normal zoom only; none below 0.75× zoom, none with reduced motion):**
  - Nutrient pulses run along paths the painter already drew: out of the Bloom, Nodes and Bellows along their feeder spokes, along the channels to pods, and into spitters that are firing.
  - Slow wet sheens appear only well inside the membrane, and nodules throb.
  - Each effect is one small sprite drawn straight onto the scene, with no masks or extra layers. At most 48 play at once.
- **Textures (`art/plant/rootweb/`):**
  - `cells.png`: a seamless 256-px cell texture laid over the membrane in world space.
  - `pulse.png`: the lavender/turquoise pulse light.
  - `sheen.png`: the wet reflection.
  - `bud.png`: a throbbing nodule.
- **Settings and fallback:**
  - On **Low** quality, or if `cells.png` fails to load, the previous Rootweb is used: the classic one on Low, the HD membrane if only the texture is missing.
  - Changing the quality repaints at once.
- **Painter scripts:**
  - `game/art-source/paint_rootweb.js` makes the textures.
  - The membrane painter itself is `paintWebArt` in the game.

## GPU renderer (v30)

From v30 the ground and the painted Rootweb are drawn by the graphics card with WebGL 2. Buildings, units, effects and the interface are still drawn by the 2D canvas, unchanged.

- **How a frame is drawn:**
  1. A hidden WebGL canvas the size of the screen draws the ground from the same terrain image as before (HD or classic). The HD ground uses mipmaps, so it no longer shimmers when zoomed out.
  2. Feeder spokes and channels are drawn as small quads into a screen-sized buffer.
  3. One shader works out the Rootweb for every screen pixel, using the coverage map, the ore map, the time each tile was covered, that buffer and `cells.png`.
  4. The finished picture is copied into the main canvas, and everything else draws on top as before, so glows and blend modes behave exactly as they did.
- **The shader is a port of `paintWebArt`:** the same coverage field, edges, tendrils, veins, channels, sheen, fungal tissue, nodules, ore fading and cell pattern. Changing the look means changing both, or retiring the 2D painter later.
- **What changes on screen:**
  - The Rootweb is drawn at screen resolution, so it is sharp up close. Thin veins are never drawn thinner than the painted art's own pixel, so the look keeps its weight, and zoomed out they fade instead of sparkling.
  - Growth is continuous. A new tile fills in from the covered ground beside it along a ragged front, instead of in three repaints.
  - Nothing is painted on the processor any more. Growth, planting and loading cost about the same as with no Rootweb at all.
- **Fallback:** the 2D painter takes over by itself when:
  - WebGL 2 is missing, or only a software emulation is available;
  - a shader fails to compile, or the graphics card resets;
  - `cells.png` can't be read by WebGL. This happens when the page is opened straight from disk in Chrome. The Windows build is not affected.

  The **Medium** and **Low** quality settings never use it. On **High** and **Epic**, the settings panel says whether the graphics card is drawing, and why not when it isn't.
- **F3** shows the frame rate and which renderer is drawing the Rootweb.
- **Gameplay:** the GPU renderer reads the same state as the 2D painter, and gameplay and saves are identical either way. The tests check this.

## Graphics quality (v30)

One setting replaces the separate HD, High Quality, Painted artwork and GPU switches. Fog of war stays on its own, because it changes how the game plays.

| Quality | Ground | Painted art and living Rootweb | Drawn by | Water ripples and dust | Resolution on high-density screens |
| --- | --- | --- | --- | --- | --- |
| Low | classic | off (classic look) | processor | off | 1× |
| Medium | HD | on | processor | off | 1× |
| High (default) | HD | on | graphics card | off | up to 1.5× |
| Epic | HD | on | graphics card | on | up to 2× |

- The preset is stored as `lc_quality`. It still writes the old switches (`lc_hd`, `lc_hq`, `lc_art`, `lc_gl`) too.
- Players coming from v29 get the preset that matches their old switches. New players start on High.
- Changing the preset redraws the ground, the Rootweb and the build-menu icons at once.
- Settings opens from the main menu as well as during a game.


## Painted Vines (v31)

The Vine, Swift Vine and Vine Knot are drawn as living vessels. This is artwork only: speed, throughput, crossing rules, rotation, costs, placement and saves are unchanged, and the tests check that a network moves exactly the same items to the same places with the painted art on or off.

- **What the game does (checked in the code before painting):**
  - A Vine carries up to 4 items (`b.belt`, each item `{i, p}` with `p` from 0 to 1 along the tile, spaced at least 0.3 apart). The Vine moves them 4.2 tiles a second and the Swift Vine 8.
  - A vessel turns when it is fed only from one side (`beltCurve`). Lines merging in from the sides are drawn as short stubs.
  - A Vine Knot has four short queues, one per exit side. An item crosses in 0.08 seconds and always leaves on the side opposite the one it came in by, so the two streams never mix.
  - The art reads that state and never writes it. Its own memory (when a vessel last moved, and what its ends meet) lives outside the block, so it never reaches a save.
- **Vine:** a translucent vessel of violet tissue with a dark rim, mottling, patchy wet highlights and small veins rooting into the ground beside it. Green sap fills the lumen. It swells slightly in the middle of each tile, so a run reads as living segments rather than a pipe. A pale venous valve (two soft cusps closing towards the flow) marks the direction.
- **Swift Vine:** the same vessel, evolved: wider, with turquoise sap, two bright ridges along its length and four pressure chambers on its walls that squeeze in turn while it is moving. Its flow streaks are brighter and closer together, and its pulses come more often.
- **Vine Knot:** a swollen bulb on supporting roots. The left-right passage runs inside the bulb under a thin veil. The top-bottom passage rises over it as a bridge, with collars where it lifts off and a shadow on the passage below. Both passages narrow inside the bulb so the bulb shows around them. Each passage glows on its own while it carries something, and each item is drawn in its own passage, moving from the side it came in towards the side it leaves by.
- **Joins:**
  - Every piece has the same cross-section at its ends, and all texture repeats exactly once per tile, so straight pieces, turns, Knot passages and Vine/Swift joins meet without a seam. The Swift Vine pinches back to the Vine's width at each end.
  - Where a Swift Vine meets a Vine or a Knot, a short fade of the Vine's tissue is laid over the Swift Vine's end, so the green and turquoise flow into each other.
  - A vessel with nothing beyond it ends in a sealed, rounded cap. Where it meets a growth that feeds it or that it feeds (Root Tap, Bloom, glands, routers and the rest), it opens into a fleshy collar.
- **Motion:**
  - Sap streaks move through the lumen at the same speed the items do. They run only while the vessel's items are actually moving: an empty vessel, or a backed-up one, shows a still frame.
  - A faint wet film shows along the walls of a moving vessel, and now and then a nutrient pulse runs down a line, at item speed.
- **Resources stay readable:** every vessel is drawn first, then the film and pulses, then the Knots, then every item. A pale halo (the membrane stretched round the item) sits behind each one, so dark coal and chitin read against the vessel. Items are never covered by an effect or by a neighbouring vessel.
- **Performance:**
  - At normal zoom and up to 450 vessels on screen, everything moves.
  - Zoomed out past 0.75×, or with more than 450 vessels on screen, every vessel shows its still frame, and the film, pulses and Knot glows stop. Items always show. Reduced-motion system settings also stop the film and pulses.
  - Measured in headless Chromium (software drawing), drawing only the vessels and their items:

| Vessels in the network | Zoom | On screen | Previous vines | Painted vines |
| --- | --- | --- | --- | --- |
| 100 | 1.6× | 100 | 3.0 ms | 3.8 ms (full motion) |
| 100 | 0.8× | 100 | 2.7 ms | 3.0 ms (full motion) |
| 500 | 1.6× | 462 | 18.0 ms | 7.0 ms (still frames) |
| 500 | 0.8× | 500 | 10.3 ms | 5.9 ms (still frames) |
| 1,000 | 0.8× | 871 | 17.1 ms | 9.6 ms (still frames) |
| 1,000 | 0.5× | 1,000 | 16.1 ms | 10.4 ms (still frames) |

Every vessel carried items, and the times are per frame including the items. `tests/vperf.js` repeats the measurement.

- **Textures (`art/plant/vine/`, painted at 96 px a tile, 4× the game):**
  - `vine.png`, `swift.png`: strips of 17 frames. Frames 1 to 16 are the sap moving one tile, and frame 17 is the still frame.
  - `vine_curve.png`, `swift_curve.png`: the same strips bent round a quarter circle, from the middle of the bottom edge to the middle of the right edge. The game rotates and mirrors them for every turn.
  - `cap.png`, `swift_cap.png`: sealed ends. `mouth.png`: the collar into a growth.
  - `film.png`, `film_curve.png`, `pulse.png`, `bulge.png`: the wet film, the travelling pulse and the halo behind items.
  - `knot_base.png`, `knot_bridge.png`, `knot_glow_h.png`, `knot_glow_v.png`: the Knot's bulb with its lower passage, the raised passage, and each passage's glow.
  - `join_in.png`, `join_out.png` and their `_curve` versions: the fades used where a Swift Vine meets a Vine or a Knot.
- **Settings and fallback:**
  - Low quality, or any of these files failing to load, gives the previous vines exactly as before. The rest of the painted art is unaffected.
  - Build-menu icons and the placement preview use the painted look too.
- **Painter script:** `game/art-source/paint_vine.js` makes every texture above. The drawing code is `drawVinesPass`, `drawVine`, `drawVineFx`, `drawVineItems` and `drawKnot` in the game.
