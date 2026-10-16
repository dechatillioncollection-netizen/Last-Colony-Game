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

Folder: `art/plant/<name>/` for Nymbri Hive structures and `art/hdf/<name>/` for HDF structures. Then add an entry to the `ART` table in the game file. This is the Seed Pod's entry:

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
  - A vessel with nothing beyond it ends in a sealed, rounded cap. Where it meets a growth that really feeds it or that it really feeds, it opens into a fleshy collar (since v35 this follows the simulation exactly: see **Connections that follow real transfer (v35)** below). Since v32 a Splitter Bulb or Sorting Gland has no collar: the vessel runs straight into the organ's own channel.
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

## Painted organs (v32): Splitter Bulb, Sorting Gland, Resin Gland, Rootweb Node

Four more growths are painted as wet, translucent organs. This is artwork only: routing, ratios, speeds, footprints, placement, costs, health, Rootweb growth and node reach are unchanged. `tests/otest.js` runs the same colony for 90 seconds in v31, in v32 with the painted art and in v32 without it, and the full save snapshots are byte-identical.

- **What the game does (checked in the code before painting):**
  - **Splitter Bulb** (`router`): holds one item (`b.buf`) for 0.06 s, then hands it to the next neighbour round the ring (`b.rr`), never back to the side it came from.
  - **Sorting Gland** (`sorter`): passes each item on at once. The chosen item (`b.cfg`) goes straight through; anything else goes left or right in turn.
  - **Resin Gland** (`press`, 2x2): holds up to 10 coal; while it has 2 or more and fewer than 10 resin stored, its progress (`b.prog`) climbs over 1.5 s, then 2 coal become 1 resin (`b.out`), which it hands to its neighbours in turn.
  - **Rootweb Node** (`node`): grows Rootweb out to 6 tiles (8 with the Deep Roots evolution), one tile at a time, nearest first (`b.wlist`, `b.wi`).
  - The art reads that state and never writes it. What it remembers (when an item last came in or left, the last progress it saw, which tendrils it drew) lives outside the block, in `OST`, so nothing reaches a save.
- **Splitter Bulb:** a swollen translucent bulb on a fleshy base, with a fluid chamber, fine inner branches and a pale valve at each opening. Each side opens into a channel only when something is connected there, and a Vine runs straight into that channel. When an item arrives the bulb swells and a pulse runs in from the side it came from; the item slides in and waits in the chamber. When the game hands it on, the valve on that side opens, the branch glows turquoise and a pulse runs out along it, and the bulb relaxes. At rest the bulb is still.
- **Sorting Gland:** an oval, lopsided chamber (a small pouch bulges behind it) with an amber filter membrane across the middle. The straight-through channel lies along the direction items come in from; the two diversion channels are thinner. A channel with nothing connected stops inside the chamber. Each time an item leaves, the chamber and filter contract and that channel glows (amber straight through, turquoise to the sides). **The chosen item is drawn last, on a dark socket, never scaled and never covered.** With nothing chosen, a pale empty ring shows instead.
- **Resin Gland:** a wet digestive sac on a dark-violet fleshy base with a collar of small lily petals, roots spreading into the Rootweb, and bioluminescent veins under the skin. It is not a tank: the sac breathes, swells and squeezes.
  - One coal fragment shows for each piece it holds (up to 10). While it is working they tumble round the sac, the veins brighten, the breathing quickens and the fluid turns amber as progress climbs. Each conversion squeezes the sac, and each piece of resin it ships sends a thick amber pulse from the lower chamber to the neighbour that received it.
  - The amber in the lower chamber rises with the resin stored.
  - Idle (out of coal, or full), it breathes slowly and the coal settles to the bottom.
  - Hurt, it sags a little (up to 10% at zero health). The white hit flash and the health bar are unchanged.
- **Rootweb Node:** a small heart of six lily petals round a translucent chamber with a glowing nucleus, on dark tissue that fades into the Rootweb with no square edge. Up to seven tendrils with buds at their tips reach out, each one only towards a tile that is already Rootweb. At rest it breathes, the nucleus drifts and the petals move slightly. Each time the node really covers a new tile, a pulse runs from the heart to that tile, a ring spreads outward, the nucleus flares and the heart contracts. The same moment also sends a pulse along the Rootweb's own channel from the node.
- **Readability:** the item in a Splitter Bulb, the Sorting Gland's chosen item, the active output glows and the Resin Gland's coal and resin level are all drawn from game state. They are never hidden by the organ's own layers or by an effect.
- **Performance:**
  - Each kind has its own crowd limit on screen: 60 Splitter Bulbs, 60 Sorting Glands, 40 Rootweb Nodes and 24 Resin Glands, plus 90 of the first three together. Past a limit, or zoomed out past 0.75×, that kind draws one cached picture per structure. The Splitter Bulb's item and active outlet glow, and the Sorting Gland's chosen item, still show. The Resin Gland only drops its detail past its own limit.
  - Layers come at half size for normal zoom, and the full 128 px textures are used only when zoomed right in. Every layer is clipped to its visible pixels. A Splitter Bulb or Sorting Gland at rest is one cached picture per set of connections, and a Node's tendrils are one cached picture per node, rebuilt only when the Rootweb under them changes. Nothing is animated per pixel.
  - Measured in headless Chromium (software drawing, so a real browser is faster), drawing only these structures. Every Splitter Bulb and Sorting Gland was busy with items, and every Resin Gland was working:

| On screen | Zoom | Previous look | Painted organs |
| --- | --- | --- | --- |
| 30 Splitter Bulbs | 1.15× | 0.7 ms | 1.1 ms (full motion) |
| 60 Splitter Bulbs | 1.15× | 1.6 ms | 3.3 ms (full motion) |
| 300 Splitter Bulbs | 1.15× | 7.4 ms | 5.3 ms (cached pictures) |
| 60 Sorting Glands | 1.15× | 0.6 ms | 2.2 ms (full motion) |
| 300 Sorting Glands | 1.15× | 2.8 ms | 4.8 ms (cached pictures) |
| 30 Rootweb Nodes | 1.15× | 0.6 ms | 3.8 ms (full motion) |
| 300 Rootweb Nodes | 1.15× | 3.9 ms | 1.9 ms (cached pictures) |
| 24 Resin Glands | 1.15× | 4.8 ms | 3.2 ms (full motion) |
| 120 Resin Glands | 1.15× | 18.4 ms | 6.1 ms (cached pictures) |
| 300 mixed | 1.15× | 4.5 ms | 3.8 ms |
| 300 mixed | 0.6× | 3.8 ms | 2.7 ms |

`tests/operf.js` repeats the measurement.

- **Textures (painted at 128 px a tile; layers for 1x1 organs are 128x128 and cover the tile):**
  - `art/plant/splitter-bulb/`: `base.png` (fleshy base, roots, shadow), `chan.png` (a channel from the right-hand edge into the bulb, with the Vine's cross-section at the edge; turned for each side), `chan_glow.png`, `valve.png` (the valve at the right-hand opening), `fluid.png`, `membrane.png`, `shine.png`, `pulse.png`.
  - `art/plant/sorting-gland/`: `base.png` (with the pouch), `main.png` (the straight channel, edge to edge), `main_glow.png`, `side.png` (a diversion channel from the right-hand edge), `side_glow.png`, `body.png` (the oval chamber), `filter.png`, `shine.png`, `socket.png` (64x64 dark socket behind the chosen item), `pulse.png`. The game turns `base`, `body`, `filter` and `shine` to line up with the incoming side.
  - `art/plant/resin-gland/` (384x384; the 2x2 footprint is the middle 256x256): `roots.png` (drawn under neighbours), `base.png` (with petal collar), `sac.png`, `resin.png` (the game shows it from the bottom up, as much as the gland holds), `coal.png` (32x32 fragment), `membrane.png`, `veins.png` (added with a light blend), `shine.png`, `pulse.png`.
  - `art/plant/rootweb-node/`: `root.png` (384x384, the node's tile in the middle; one tendril running right, ending in a bud), `base.png`, `petal.png` (40x56, base at the top), `fluid.png`, `nucleus.png` (48x48), `membrane.png`, `ring.png`, `pulse.png`.
  - Any replacement must keep these sizes and the channel cross-section at the tile edge, or Vines will not meet the channels cleanly.
- **Settings and fallback:**
  - Low quality gives the previous look for all four.
  - If any file for one of them fails to load, that structure falls back to its previous look and the others stay painted.
  - Build-menu icons use the cached resting picture.
- **Painter script:** `art/source/paint_organs.js` makes every texture above (run with `node art/source/runpaint.js art/source/paint_organs.js art/plant`). The drawing code is `drawSplitter`, `drawSorter`, `drawResin`, `drawResinUnder`, `drawNode`, `drawNodeEv` and `drawNodeUnder` in the game.

## Connections that follow real transfer (v35)

Before v35 a vessel opened into a collar wherever it touched a growth, and a Root Tap beside a vessel's side showed nothing even though it was pushing items in. Now every opening on a Vine, Swift Vine, Splitter Bulb or Sorting Gland is drawn from the same rules the simulation uses to move items, so a collar or channel means items can pass there and a sealed end means they cannot. This is artwork only: `tests/ident35.js` plays the same colony in v34 and v35 and the saves are byte-identical.

- **What the game does (checked in the code before drawing):**
  - A vessel takes items from anything except the tile it points at (`accepts`), and hands them only to the tile it points at.
  - Root Taps, Deep Roots, Resin Glands and Chitin Vats push their output into any neighbour that will take it (`offload`). Splitter Bulbs and Sorting Glands pass items to their neighbours in turn. A Vine Knot passes an item straight across to the side opposite the one it came in by.
  - The Bloom, Sap Burners, Resin Glands, Chitin Vats, the Spawning Pod, Knots, Bulbs, Glands and spitters that take ammo all take items in. The Bloom never pushes items out. Walls, Rootweb Nodes and Spore Bellows neither take nor give.
- **The rules the art now follows** (`feedsInto` and `takesFrom` in the game):
  - **Front of a vessel:** it joins seamlessly into a vessel, Knot or organ channel that takes from it, opens into a collar on a growth that takes from it, and otherwise ends in a sealed cap. So a vessel pointing into a Root Tap, a wall, a Node or another vessel head-on is capped.
  - **Back of a vessel:** a collar only where the growth behind really pushes items into it (a Root Tap, Deep Root, Resin Gland or Chitin Vat). A vessel leading away from the Bloom is capped at the Bloom, because the Bloom gives nothing out.
  - **Side feeds:** a Root Tap (or any other growth that pushes items) beside a vessel's side now shows a short stub and a collar on that side, the same as a vessel merging in. A vessel fed only from one side by a growth bends out of it, starting in a collar.
  - **Splitter Bulb and Sorting Gland:** a side opens into a channel only towards a neighbour that really passes items with it: a vessel (either way round), a Knot, another organ, a growth that pushes items in, or one that takes them. A Node, Bellows or wall beside a bulb leaves that side closed.
- **Splitter Bulb direction:** the bulb has no fixed entrance. It hands each item to the next neighbour that will take it, never back to the side it came from, so when the vessels around it are turned round the old entrance becomes an exit and the art follows at once. `tests/btest.js` checks this with 13 routing cases (every input side, reversal, rotating one neighbour, two inputs, one, two or all exits blocked and reopened, long chains, save and load with items inside, nothing made or lost).
- **Drawing:** the same textures as before (`cap.png`, `mouth.png` and the organ channels). Side feeds reuse the merge stubs plus a collar. What each end meets is worked out when the network changes and kept outside the block (`_st`, `_cm` are listed in `BLOCK_SKIP`), so nothing reaches a save.

## Dormant Rootweb (v35)

Only the Bloom feeds the Rootweb. Rootweb joined to the Bloom through other Rootweb is fed; a patch with no Rootweb path back to the Bloom (for example after the Node linking it is destroyed and its tissue recedes) goes dormant. This is a look only: buildings on dormant Rootweb keep working, Nodes keep growing it, and nothing is damaged, slowed or switched off. A Node is not a source of nourishment by itself.

- **Working out supply** (`webSupply`):
  - A flood fill over covered tiles, counting diagonal neighbours as joined, starting from every tile of the Bloom's own Rootweb and the ring round the Bloom.
  - It runs only after the Rootweb changes (a tile grows or recedes), and at most four times per game second. On the 144×144 Base Siege map it costs well under a millisecond (see the table below).
  - If several routes join a patch to the Bloom and one is cut, the patch stays fed through the others.
  - Nothing is saved. After loading, supply is worked out again from the Rootweb in the save and shown at once, with no fade.
- **Fading** (`webSupTick`): each tile has a dormancy value from 0 (fed) to 1 (dormant). It rises over about 14 seconds after a patch is cut off and falls over about 6 seconds once it is joined again. The painters only repaint a tile when its value crosses one of 8 steps, so a fade costs at most 8 repaints per tile.
- **How dormant Rootweb looks:**
  - **Painted Rootweb (Medium, 2D):** each pixel is blended towards a dull grey-violet, darkened a little and made slightly more transparent; the vein and cell detail fades by half. The dormancy is averaged across tile corners, so the colour shifts smoothly across a patch.
  - **GPU Rootweb (High, Epic and the Windows app):** the same blend in the shader, from a one-byte-per-tile texture filtered smoothly between tiles. Edge strands, veins and channels dim with it.
  - **Low and the HD membrane:** a grey-violet wash laid only over the tile's own membrane and edge, so the bright outline turns grey.
  - **Pulses:** no nutrient pulse starts in dormant tissue. Spokes from Nodes and Bellows on a cut-off patch stop, channels that end in one stop, and sheens and buds only appear on tissue less than half dormant. Pulses already running finish their path.
- **Reconnecting:** when a new Node or regrown tissue joins the patch to fed Rootweb again, it is fed straight away, pulses start again and the colour comes back over about 6 seconds.
- **Performance** (`tests/perf35.js`, headless Chromium with software drawing, so a real browser is faster). The Last Colony map (144×144) with 33 Rootweb Nodes in twelve chains; the middle Node of every chain is destroyed and the game runs 35 seconds while the 12 outer patches (about 120 tiles) are cut off and fade. Times are per frame, averaged over two runs:

| | v34 | v35 |
| --- | --- | --- |
| Supply flood fill (`webSupply`), one call | n/a | 0.28 ms |
| Supply and fade, per frame (`webSupply` + `webSupTick`) | n/a | 0.2 to 0.35 ms |
| Fade step with nothing fading | n/a | under 0.01 ms |
| Whole frame, painted 2D Rootweb (`render`) | 13.9 ms | 14.6 ms |
| Rootweb repaints, painted 2D (`paintWeb` calls in 35 s) | 3,354 | 3,351 |
| Whole frame, GPU Rootweb (`render`) | 3.8 ms | 3.9 ms |
| GPU upload (`glUpload`, now including the dormancy texture) | 0.18 ms | 0.27 ms |

The supply check only runs after the Rootweb changes and at most four times a game second, and the fade step returns at once when nothing is fading. A fade repaints each 2D tile at most 8 times, and the repaint shares the existing per-frame budget, so the number of repaints in the run was the same as v34. Frame-time percentiles were the same in both builds (2D: 66.6 ms median in both, the slow software renderer dominates).
- `tests/dtest.js` covers all of this (12 checks, on the 2D painter with `GL=0` and the GPU with `GL=2`).

## Painted extraction (v37): Root Tap, Deep Root, Chitin Vat

The three 2x2 production growths are painted as living organs. This is artwork only: mining rates, ore, recipes (1 coal + 2 sand = 1 chitin), the 30 vigor the vat needs, costs, footprints, health, building rules, throughput, routing and the save format are unchanged. `ident37.js` plays the same colony in v36 and v37, drawing every other step with painted art on and through a wave, and the saves are byte-identical on Medium and Epic. `xtest37.js` compares what every structure shipped and holds with v36 in the Test Range and in Survival, with and without vigor.

- **What the game does (checked in the code before painting):**
  - **Root Tap** (`drill`, rate 0.15) and **Deep Root** (`pdrill`, rate 0.22, titanium at 0.7×) mine the ore under their 2x2 (`oreItem`, `oreCount`; sand comes from sand floor). Progress (`b.prog`) climbs to 1, then one piece goes into the store (`b.out`, at most 10) and progress drops back. Each step a stored piece is offered round the neighbours in turn (`offload`, `b.rr`). With 10 stored, mining stops.
  - **Chitin Vat** (`smelter`) holds coal and sand (`b.inv`). While it has 1 coal, 2 sand and fewer than 10 chitin stored, progress climbs at the vigor satisfaction over 0.8 s; at 1 it uses the inputs and stores one chitin, which it offers round its neighbours. Without vigor progress stays where it is.
  - None of them had animation events. The art makes its own from that state, in `OST` (outside the block, never saved): progress dropping is one piece mined or one plate finished; the store going down by more than was just made is one piece handed on, and `b.rr` says to whom; the vat's coal or sand going up is one piece arriving.
- **Root Tap:** a thick purple root crown with a buttress lobe flaring out towards each of six tendrils. The tendrils end in dark pits on the deposit, each splitting into fine roots, so the ore shows between them at the corners and edges and the tap reads as rooted into it. In the middle is an exposed, translucent absorption sac under a soft violet membrane, with a wet shine. Three to six grains of the ore it is mining float in the sac, tinted from the resource's own colour (copper, lead, coal, sand); the resource icon in the corner is the same one as before and is drawn once. For each piece mined:
  1. The tendrils contract against the deposit (8%, 0.12 s).
  2. A pulse carrying a grain runs up two tendrils to the sac (0.3 s), and the channels in the crown light.
  3. The sac fills as it arrives (5%).
  4. The grain leaves along the vessel to the neighbour that really took it, and that vessel glows.
  At rest (backed up, or nothing to mine) it barely breathes and the grains are still.
- **Deep Root:** the same organ, evolved. The crown is heavier and rounder, on eight thicker, longer tendrils with a blue-white vascular line. The pressure chamber is smaller, behind a thick clear wall held by three hardened ribs, and a collar of pale layered cellulose segments with faint blue mineral glints surrounds it. Internal channels run from the chamber under the collar to the tendrils. Its contractions are slower and stronger (10%, 0.22 s), the pulse takes three tendrils (0.42 s) and the chamber swells harder (7.5%). Its speed is not changed. At normal zoom the soft bubble of the Root Tap and the ribbed shield of the Deep Root are easy to tell apart.
- **Chitin Vat:** a swollen semi-transparent vat on a deep-purple fleshy foundation, with nutrient veins running up into it, pale milky fluid inside, membrane folds round the opening on top and vessel stubs as its inlets and outlet. Two hardened chitin plates always show inside, plus one for each chitin it holds ready to ship (up to three more). While it works:
  1. Each piece of coal (dark) or sand (pale) that arrives comes in from the vessel or tap that brought it.
  2. The fluid turns, and the coal and sand it holds are carried round.
  3. The next plate appears gradually as progress climbs.
  4. When a plate is finished the vat squeezes and the folds close round the opening.
  5. The chitin leaves along the vessel to the neighbour that took it.
  Idle (short of coal or sand, full, or without vigor) the fluid barely moves, the plates stay visible and the vat breathes slowly.
- **Hurt and built:** each sags a little as it is hurt (up to 8% at zero health). The white hit flash, health bar, build fade and selection box are drawn by the game as before.
- **Openings:** an edge tile gets a vessel stub (the Vine's own cross-section at the tile edge, so a Vine or Swift Vine carries straight on into it) only where a neighbour can really take this growth's item, as `accepts()` decides it (a vessel not pointing at it, the Bloom, a Knot, Bulb or Gland, a growth whose recipe uses that item, a turret that fires it). So a Resin Gland beside a copper tap gets no opening, and a vessel pointing into a tap gets none. For the vat, vessels pointing into it and taps on coal or sand beside it get one too. Vine ends are drawn exactly as in v35; the pending global vine fixes are not part of this.
- **Footprint:** the organs stay inside their 2x2. The fine root net at the tendril tips reaches a little past it and is drawn under neighbouring growths.
- **Performance:**
  - Each kind has its own crowd limit on screen: 32 Root Taps, 32 Deep Roots and 24 Chitin Vats. Past a limit, or zoomed out past 0.75×, that kind draws one cached picture per set of openings, plus the resource icon, and the channels still flash each time a piece is mined (the vat's veins glow while it works).
  - The foundation and vessel stubs are one cached picture per set of openings. The grain tints are made once when the art loads. Layers are half size at normal zoom and clipped to their visible pixels. Nothing is processed per pixel per frame.
  - Measured with `xperf37.js` in headless Chromium on Medium (software drawing, so a real browser is faster), everything working and in view at 0.9× zoom. Times are for the whole frame's `render()`; the median is the useful number, because the background Rootweb repaints make occasional slow frames in both builds and pull the mean up:

| On screen | v36 median | v37 median | v36 mean | v37 mean |
| --- | --- | --- | --- | --- |
| 25 Root Taps | 2.9 ms | 3.5 ms (full motion) | 16.9 ms | 19.7 ms |
| 50 Root Taps | 5.1 ms | 3.4 ms (cached pictures) | 27.5 ms | 21.6 ms |
| 100 Root Taps | 6.1 ms | 4.4 ms (cached pictures) | 28.8 ms | 25.4 ms |
| 25 Deep Roots | 2.8 ms | 3.3 ms (full motion) | 16.2 ms | 19.9 ms |
| 50 Deep Roots | 3.8 ms | 3.1 ms (cached pictures) | 21.6 ms | 19.2 ms |
| 100 Deep Roots | 6.1 ms | 4.3 ms (cached pictures) | 30.6 ms | 26.5 ms |
| 25 Chitin Vats | 3.1 ms | 2.5 ms (cached pictures) | 18.2 ms | 14.2 ms |
| 50 Chitin Vats | 3.9 ms | 3.1 ms (cached pictures) | 22.3 ms | 20.2 ms |
| 100 Chitin Vats | 5.9 ms | 4.5 ms (cached pictures) | 29.5 ms | 26.7 ms |
| 25 mixed | 3.2 ms | 3.5 ms (full motion) | 18.1 ms | 20.0 ms |
| 50 mixed | 4.4 ms | 4.7 ms (full motion) | 22.9 ms | 23.2 ms |
| 100 mixed | 6.6 ms | 4.8 ms (cached pictures) | 29.8 ms | 28.2 ms |

- **Textures** (all 384x384 with the 2x2 footprint in the middle 256x256, except where noted):
  - `art/plant/root-tap/` and `art/plant/deep-root/`: `roots.png` (drawn under neighbours), `base.png` (crown, and for the Deep Root its cellulose collar), `tendrils.png` (the game contracts it), `sac.png`, `membrane.png`, `veins.png` (added with a light blend), `shine.png`, `grain.png` (32x32 grey grain, tinted per resource), `chan.png` and `chan_glow.png` (128x128 vessel stub from a tile's right edge inward), `pulse.png`.
  - `art/plant/chitin-vat/`: `roots.png`, `base.png` (foundation and veins), `fluid.png`, `swirl.png` (turned by the game), `plate.png` (72x72), `coal.png` and `sand.png` (32x32), `membrane.png` (with the opening cut out), `folds.png`, `veins.png`, `shine.png`, `chan.png`, `chan_glow.png`, `pulse.png`.
  - The tendril tips and chamber sizes are repeated in the game (`XG`); a repainted tap must keep them, or the pulses will not start at the painted tips.
- **Settings and fallback:** Low quality and painted art off give the previous look. If any file for one of the three fails to load, that structure falls back to its previous look (with a console warning) and the others stay painted. Build-menu icons use the baked resting picture.
- **Painter script:** `art/source/paint_extract.js` (run with `node art/source/runpaint.js art/source/paint_extract.js art/plant`). The drawing code is `drawTap`, `drawTapUnder`, `drawVat`, `vatPlates`, `xLinks`, `xTakes`, `xFeeds`, `xShip` and `tapGrains` in the game.
