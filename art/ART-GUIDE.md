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

## Painted energy growths (v38): Sap Burner, Sunleaf, Spore Bellows

The two vigor growths and the Rootweb accelerator are painted as living organs. This is artwork only: the 60 vigor of a burning Sap Burner, the 5 of a Sunleaf, coal use (one piece burns for 2 s), the Spore Bellows' doubled spread within 12 tiles and its 10 vigor, costs, footprints, health, building rules and the save format are unchanged. `ident38.js` plays the same colony in v37 and v38, drawing every other step with painted art on and through a wave, and the saves are byte-identical on Medium and Epic. `xtest38.js` compares vigor made and used, coal burned, Rootweb spread and every store with v37 in the Test Range and in Survival, with and without vigor.

- **What the game does (checked in the code before painting):**
  - **Sap Burner** (`combustion`, 1x1, 100 hp) takes coal from vines, taps, Knots and Bulbs while it holds fewer than 10 (`accepts`). When its burn timer (`b.burn`) has run out and it has coal, it uses one piece and sets the timer to 2 s. While the timer is above zero it adds 60 to the swarm's vigor (`computePower`).
  - **Sunleaf** (`solar`, 1x1, 80 hp) always adds 5 vigor. It has no input, no timer and no other state.
  - **Spore Bellows** (`bellows`, 2x2, 220 hp) always counts 10 vigor as used. While the swarm has at least a quarter of the vigor it needs (`G.powSat >= .25`), every Rootweb source (the Bloom or a Rootweb Node) whose centre is within 12 tiles of the Bellows' centre spreads twice as fast (`bellowsNear`, `stepWeb`). Each source walks its own list of tiles (`b.wlist`, `b.wi`).
  - None of them had animation events. The art makes its own from that state, in `OST` (outside the block, never saved): the burn timer jumping back up is one piece of coal taken in; the coal store going up is a piece arriving; a source within 12 tiles moving along its list onto a tile covered just now, while the swarm has the vigor, is the Bellows really boosting new growth.
- **Sap Burner:** a compact, dense violet body ringed by heavy lobes, with a raised rim of fleshy folds round a small translucent reaction chamber. The tissue nearest the chamber is heat-darkened and finely cracked. Inside sits the coal it is digesting, a dark lump with amber cracks that gets smaller as the piece burns down. For each piece of coal:
  1. The new lump slides in from the rim (from the side its vine comes in, when there is one) and the folds open a little.
  2. The chamber swells (6%) and its amber glow surges.
  3. The glow holds steady while the piece burns.
  4. Twice per piece, vigor pulses run out along three of its six vessels.
  5. The glow eases off as the piece runs out, then the next piece catches.
  A piece of coal arriving by vine runs in along its vessel stub. With no coal the chamber goes dark within a second and only slow breathing remains. The game's own warm light round a burning burner is unchanged.
- **Sunleaf:** a rosette of broad translucent leaves like water-lily pads, five large and five small, pale turquoise fading to lavender at the rims, with a midrib and paired side veins in each, fanning from a small wet stem knot. In the middle a cup of lavender bracts holds a softly luminous heart. Because it always makes its vigor, it has one calm rhythm (every 3.4 s, offset per leaf): wet light drifts slowly across the leaves, two faint pulses gather from the leaf tips to the heart, the heart brightens a little, and a fainter pulse runs out along a root. It is lighter, paler and finer than the dense, dark burner, so the two are easy to tell apart.
- **Spore Bellows:** three translucent bellows sacs, heavy with pale spore mist and pleated where they fold, on a fleshy lobed root base with veins running up into them, and three frilled, gill-like vents where the sacs meet. While it is really boosting new growth it breathes in full, one breath every 2.8 s:
  1. The sacs fill one after another (up to 17% larger) and the mist inside thickens.
  2. They squeeze (down to 88%) and puff spores out of the vents, which spread a little way and thin out.
  3. Its veins light briefly.
  4. Spores drift out to up to six tiles its sources have just covered (within 16 tiles), and that new Rootweb glints as they settle.
  5. It relaxes before the next breath.
  When the sources in reach have finished spreading it completes its breath and rests, the sacs barely moving and a few spores drifting inside. Without enough vigor the sacs sag a little and the spores barely move. There is no fog when it is idle.
- **Hurt and built:** each sags a little as it is hurt (up to 8%). The white hit flash, health bar, build fade and selection box are drawn by the game as before.
- **Openings:** a Sap Burner gets a vessel stub on a side only where a neighbour really feeds it coal: a vine pointing into it, a Knot, Bulb or Sorting Gland, or a tap on coal. The Sunleaf and Spore Bellows take no items and get none. Vine ends are drawn exactly as before.
- **Footprint:** the organs stay inside their tiles. Fine roots reach a little past them and are drawn under neighbouring growths.
- **Performance:**
  - Crowd limits on screen: 40 Sap Burners, 40 Sunleaves and 16 Spore Bellows. Past a limit, or zoomed out past 0.75×, that kind draws one cached picture. A burner still shows its glow (one extra draw), so burning and idle stay readable; a Bellows' veins still flash when it breathes out.
  - The burner's base and vessel stubs are one cached picture per set of openings. Layers are half size at normal zoom and clipped to their visible pixels. Nothing is processed per pixel per frame. The Bellows looks up the sources in its reach twice a second.
  - Measured with `xperf38.js` in headless Chromium on Medium (software drawing, so a real browser is faster), everything in view at 0.9× zoom and every burner burning. Times are for the whole frame's `render()`. The median is the useful number, because the background Rootweb repaint of the freshly laid test ground makes occasional slow frames in both builds; their total time is the same in both.

| On screen | v37 median | v38 median | v37 mean | v38 mean |
| --- | --- | --- | --- | --- |
| 25 Sap Burners | 2.3 ms | 2.6 ms (full motion) | 13.4 ms | 13.6 ms |
| 50 Sap Burners | 2.6 ms | 2.6 ms (cached pictures) | 14.5 ms | 15.7 ms |
| 100 Sap Burners | 3.0 ms | 3.0 ms (cached pictures) | 16.6 ms | 17.2 ms |
| 25 Sunleaves | 2.1 ms | 2.5 ms (full motion) | 12.0 ms | 13.1 ms |
| 50 Sunleaves | 2.2 ms | 2.5 ms (cached pictures) | 11.3 ms | 13.4 ms |
| 100 Sunleaves | 2.4 ms | 2.7 ms (cached pictures) | 12.3 ms | 12.6 ms |
| 25 Spore Bellows | 2.6 ms | 2.2 ms (cached pictures) | 13.6 ms | 13.1 ms |
| 50 Spore Bellows | 3.1 ms | 2.5 ms (cached pictures) | 16.4 ms | 14.0 ms |
| 100 Spore Bellows | 4.1 ms | 2.8 ms (cached pictures) | 21.3 ms | 15.7 ms |
| 25 mixed | 2.4 ms | 2.8 ms (full motion) | 12.7 ms | 13.4 ms |
| 50 mixed | 2.9 ms | 3.4 ms (full motion) | 17.9 ms | 16.1 ms |
| 100 mixed | 3.4 ms | 3.8 ms (Bellows cached) | 18.4 ms | 18.1 ms |

- **Textures:**
  - `art/plant/sap-burner/` (256x256 with the tile in the middle 128x128): `roots.png` (drawn under neighbours), `base.png` (body, ridges and scorched ring), `chamber.png`, `glow.png` (added with a light blend), `ember.png` (48x48, the coal being digested), `coal.png` (32x32), `membrane.png`, `ridges.png` (the game opens them), `veins.png`, `shine.png`, `chan.png` and `chan_glow.png` (128x128 vessel stub from a tile's right edge inward), `pulse.png`.
  - `art/plant/sunleaf/` (256x256): `roots.png`, `base.png`, `leaves.png`, `veins.png`, `heart.png`, `sheen_a.png` and `sheen_b.png` (the game fades between them), `pulse.png`.
  - `art/plant/spore-bellows/` (384x384 with the 2x2 footprint in the middle 256x256): `roots.png`, `base.png`, `sac.png` (160x160, one sac, drawn three times), `mist.png` (128x128), `vents.png`, `spore.png` (24x24), `puff.png` (128x128), `veins.png`, `pulse.png`.
  - The chamber radius, vessel and leaf angles, sac and vent positions are repeated in the game (`EG`); a repainted texture must keep them.
- **Settings and fallback:** Low quality and painted art off give the previous look. If any file for one of the three fails to load, that structure falls back to its previous look (with a console warning) and the others stay painted. Build-menu icons use the baked resting picture.
- **Painter script:** `art/source/paint_energy.js` (run with `node art/source/runpaint.js art/source/paint_energy.js art/plant`). The drawing code is `drawBurner`, `eLinks`, `eUnder`, `drawSunleaf`, `drawSmallUnder`, `drawBellows`, `bellowsTrack`, `sacK` and `webBornAt` in the game.

## Painted defensive organs (v40): Bark Wall, Great Bark, Ironbark

The three walls are painted as living bark. This is artwork only: health (340, 1400 and 560), costs (6 copper, 24 copper, 6 titanium), footprints, solidity, how units path round walls, how turrets rank them as targets, how Healing Pods mend them, the HDF's own walls and the save format are unchanged. `ident40.js` plays the same walled colony in v38 and v40, drawing every other step with painted art on and through a wave that breaks walls while a Healing Pod mends them, and the saves are byte-identical on Medium and Epic. `xtest40.js` compares every building's health, every enemy and every store with v38 after 40 s of fighting in the Test Range arena, and in Survival with walls hurt on a schedule and mended.

- **What the game keeps for a wall (checked in the code before painting):**
  - `b.hp` of `b.max` (`max` is the type's health when placed). Both are saved.
  - `hurtBlock` is the only thing that lowers a wall's health. It also sets `b.hit` (0.12 s), which the game uses for its white flash. A wall at 0 is destroyed.
  - A powered Healing Pod raises the health of every growth within 6 tiles by 12% of its maximum every 2 s of powered time.
  - Nothing else: walls have no store, timer, power or animation state, and the game does not record where a hit came from or what made it.
  - The art therefore works out its own events from health alone and keeps them in `OST` (outside the block, never saved): health lower than the last frame it was drawn is a hit, its size is how hard; health higher is a Healing Pod repair. If a wall has not been drawn for 0.3 s (out of view, another screen), it catches up without reacting, so a hit you did not see never plays late, and loading a save with hurt walls shows them torn but starts no reaction.
- **Bark Wall:** light and quick to grow. A rounded block of soft umber bark tissue whose grain flows round two knots, with five living roots woven over and under each other through it, each bending its own way and thinning to a tip that dives under at the edge. Short root feet grip the ground round it.
- **Great Bark:** four walls' worth grown as one. Thick bark plates overlap like shingles, each throwing a deep shadow on the one below, bound by two great root bundles, each a pair of roots twisted round each other, that knot in the middle. Heavier buttress roots, darker colours and a deeper shadow give it the strongest silhouette, which stays readable zoomed out.
- **Ironbark:** the hardest bark: five domed plates crowded so tight they press into each other, near black with a violet cast, flecked with pale mineral grit where it has taken up titanium, gripped round two corners by hardened, knotted roots. No straight lines, rivets or metal shine: the light it catches is a dull glint on the grit and the tops of the plates.
- **Joining:** a wall knits a bundle of two twisting roots across every edge it shares with another wall or gate of ours. Both walls draw one, so the bundle reads whole and a run of walls reads as one hedge. Great Bark does this per tile along its sides. Gates, other growths and HDF walls get no bundle.
- **Reactions (only from real changes in health):**
  - **Hit:** the wall flinches inward and springs back in 0.34 s (Bark Wall up to 7%, Great Bark 4.5%, Ironbark 3.5%, scaled by how hard the hit was), and a bead of sap wells up and runs a little way down over 1.1 s. The sap shows at a spot on the wall chosen from the wall and its hit count, because the game has no hit position. The game's white hit flash is unchanged.
  - **Health:** below 92% the bark cracks and beads of sap show in the cracks (fully shown by 60%). Below 55% deep splits open to raw, wet tissue, bark is torn back and a root snaps (fully shown by 25%). A hurt wall sags up to 4%. Below 35% the raw tissue throbs faintly. Health going back up closes the wounds again. The wound look changes in steps of 5% of health.
  - **Mended:** when a Healing Pod raises its health, pale green healing light runs along its roots and fades over 0.9 s.
  - **Idle:** a healthy Bark Wall breathes by 0.6% every 6.2 s, Great Bark 0.4%, and Ironbark not at all. Nothing else moves.
- **Built, selected, destroyed:** the build fade, selection box, health bar and destruction are drawn by the game as before.
- **Performance:**
  - Each wall's root feet and joining bundles are one cached picture per set of neighbours, drawn in the pass under all buildings. The body, its wounds and its wet light are one cached picture per kind for each 5% step of health, so a wall at normal zoom draws two pictures (feet and joins, then body), plus a sap bead or the mend light only while a reaction is playing and a faint extra wound layer below 35% health.
  - Crowd limits on screen: 140 Bark Walls, 140 Ironbark and 48 Great Bark. Past a limit, or zoomed out past 0.75×, that kind draws the same cached body picture without motion, so damage still reads in a crowd and from far away. Joins and feet are the same cached picture in both modes.
  - Layers are half size at normal zoom and clipped to their visible pixels. Nothing is processed per pixel per frame. Each wall looks up its four sides twice a second.
  - Measured with `xperf40.js` in headless Chromium on Medium (software drawing, so a real browser with a GPU is faster), everything in view at 0.9× zoom with the walls laid in joined rows. Each time is the whole frame's `render()` plus reading one pixel back from the canvas, which makes the canvas finish its drawing inside the timed span. Without that read-back, headless Chromium saves up several frames and draws them all in one slow frame every few frames, which makes means jump about by several milliseconds from run to run in both builds. The v38 reports were measured without it, so their numbers are not comparable with these.

  | On screen | v38 median | v40 median | v38 mean | v40 mean |
  | --- | --- | --- | --- | --- |
  | 50 Bark Walls | 12.2 ms | 13.6 ms (full motion) | 12.4 ms | 14.4 ms |
  | 100 Bark Walls | 13.3 ms | 15.2 ms (full motion) | 13.4 ms | 16.3 ms |
  | 200 Bark Walls | 14.9 ms | 16.6 ms (Bark Walls cached) | 15.4 ms | 17.6 ms |
  | 50 Ironbark | 13.5 ms | 13.3 ms (full motion) | 14.2 ms | 13.8 ms |
  | 100 Ironbark | 14.1 ms | 14.7 ms (full motion) | 15.5 ms | 15.1 ms |
  | 200 Ironbark | 14.7 ms | 16.4 ms (Ironbark cached) | 16.0 ms | 17.6 ms |
  | 50 Great Bark | 13.8 ms | 14.3 ms (Great Bark cached) | 15.0 ms | 14.7 ms |
  | 100 Great Bark | 14.9 ms | 16.8 ms (Great Bark cached) | 15.6 ms | 17.4 ms |
  | 200 Great Bark | 17.5 ms | 20.4 ms (Great Bark cached) | 19.3 ms | 21.2 ms |
  | 50 mixed | 13.3 ms | 13.7 ms (full motion) | 14.0 ms | 14.2 ms |
  | 100 mixed | 13.2 ms | 15.2 ms (full motion) | 13.5 ms | 15.8 ms |
  | 200 mixed | 18.3 ms | 16.6 ms (Great Bark cached) | 19.8 ms | 17.2 ms |
  | 50 mixed, hurt and being hit | 13.1 ms | 13.9 ms (full motion) | 13.4 ms | 14.2 ms |
  | 100 mixed, hurt and being hit | 14.0 ms | 16.6 ms (full motion) | 14.3 ms | 18.4 ms |
  | 200 mixed, hurt and being hit | 15.4 ms | 19.4 ms (Great Bark cached) | 15.7 ms | 21.2 ms |

  In typical use (50 to 200 walls in view) the painted walls add about 0.5 to 2 ms to a frame, roughly 0.01 ms per wall. The heaviest case, 200 walls all hurt with one being hit every 0.2 s, adds about 4 ms. Ironbark costs about the same as before. Results vary by 1 to 2 ms between runs (200 mixed walls happened to measure faster than v38).
- **Textures:**
  - `art/plant/bark-wall/` and `art/plant/ironbark/` (256x256 with the tile in the middle 128x128), `art/plant/great-bark/` (384x384 with the 2x2 footprint in the middle 256x256), each with: `roots.png` (feet, drawn under neighbours), `join.png` (96x128, the bundle from a tile's centre at x=0 to a quarter tile past its edge, which the game turns to face each neighbour), `base.png`, `wound1.png` (cracks), `wound2.png` (deep splits), `sheen.png` (wet light), `mend.png` (added with a light blend), `seep.png` (48x48, one sap bead).
  - Box sizes, breathing and flinch strength are in the game's `DW` table; a repainted texture must keep the body inside its footprint and the bundle centred on the tile's middle line.
- **Settings and fallback:** Low quality and painted art off give the previous look. If any file for one of the three fails to load, that wall falls back to its previous look (with a console warning) and the others stay painted. Build-menu icons and the placement ghost use the baked healthy picture.
- **Painter script:** `art/source/paint_defense.js` (run with `node art/source/runpaint.js art/source/paint_defense.js art/plant`). The drawing code is `drawWall`, `drawWallUnder` and `wLinks` in the game.

## Painted gates and Healing Pod (v41): Petal Gate, Maw Gate, Healing Pod

The two gates and the Healing Pod are painted as living tissue to match the v40 walls. This is artwork only: passage (`solidFor` lets any of our units through a gate and no one else), collision, pathing, health (300, 1300 and 90), costs, the pod's repair (12% of maximum every 2 s of powered time, 6 tiles, 12 vigor), the HDF's gates and the save format are unchanged. `ident41.js` plays a walled colony with both gates and a pod through a wave, with ants walking through the gates, and the saves are byte-identical between v40 and v41 and between art off and on (Low, Medium, Epic). Full report: `docs/v41-gates-pod-art.md`.

- **What the game keeps (checked in the code before painting):**
  - Gates: `gateOpen(b,t)` eases `b.op` 18% per call towards 1 when any of the gate's own units is within half its size plus 1.4 tiles of its centre, else towards 0. It is called once per drawn frame and `b.op` is saved. Passage never reads it.
  - Healing Pod: `b.prog` counts powered time; at 2 s it mends every damaged growth of ours within 6 tiles and, if it mended any, adds a `heal` effect (`G.fx`, not saved) at the pod.
  - The Petal Gate's description says it is too narrow for Bulwark Ants, but in v41 the simulation let them through (a Bulwark collides as radius 0.42). The art follows the simulation. v42 makes the rule real (see below), and the Petal Gate then stays shut for a Bulwark because `gateOpen` ignores it.
- **Opening is the game's:** `drawGateP` and `drawGateM` call `gateOpen` exactly once per draw (as the previous look did, so saves match with art on or off) and draw `b.op`. There is no separate visual decision. Units are drawn above buildings, and `b.op` is above 0.9 whenever an ant overlaps a gate.
- **Petal Gate:** two bark jambs that continue the walls, lined with pale tissue, and two overlapping fleshy petals (`petalL` over `petalR`) meeting at a seam, with fibres, veins and a translucent edge, over a dark passage (`floor`). Opening: the seam tightens (`1+3.5%` width for the first 30% of `op`), then each petal folds back towards its jamb (to 26% width) while lengthening 6%. In a vertical wall line (links up and down, none sideways) the gate is drawn turned 90° so the petals part across the line. Root feet sit under the jambs only, never over the passage.
- **Maw Gate:** a ring of sphincter fibres, 16 cellulose ribs, bark corner plates and root bundles (`base`), round six overlapping reinforced membranes (`leaf0` to `leaf5`) over a dark throat (`throat`, 0.78 tiles in radius, so a Bulwark visibly fits). A small pinhole stays at the very centre when shut. Opening: the ring pinches 3% (first 36% of `op`), then each membrane rotates up to 0.95 rad about its pivot on the ring and shrinks to half, like an iris. `leaf0` is drawn a second time clipped to its leading half so the overlap closes round the circle.
- **Healing Pod:** a waterlily-like organ: two rings of lilac petals (`petals`), a glossy chamber of pale green sap (`chamber`, `gloss`) with four drifting motes (`mote`), faint vascular channels (`veins`, added with a light blend) and a soft glow (`glow`). It is drawn at 1.25× its painted size (`PODS`) about the tile centre so it fills its tile.
  - At rest it breathes 1.5% every 5.2 s; veins at 16%.
  - While the game would repair something now (re-read 4 times a second, and every frame as `prog` passes 1.7) and it has vigor, `act` eases to 1: veins brighter and the chamber swells up to 3.5% as the next repair comes due.
  - On the frame the game adds its fresh heal effect for this pod, it pumps: the chamber squeezes 13%, veins and glow flare and ease back over about 0.6 s, and a pulse of sap (`pulse`) runs along an arc to each of the 8 nearest growths whose health actually rose. Growths other than walls and gates get a soft glow on arrival; walls and gates show their own v40 mend light instead, so bright effects are not stacked.
  - With no vigor or nothing damaged, nothing plays.
- **Hits, damage and mends:** as on the walls (`hTrack`, shared logic). A real drop in health flinches it (`DG`: Petal 6%, Maw 4%, pod 6%) and draws a sap bead (`seep`); cracks (`wound1`) below 92% and splits (`wound2`) below 55% are cut into the body with source-atop, in 5% steps of health; a pod repair plays `mend` on the gates for 0.9 s.
- **Joining:** both gates draw root bundles (`join`) into neighbouring walls and gates of ours, per tile along their sides, cached per set of neighbours in the pass under buildings (`drawGateUnder`), as walls do.
- **Performance:** each structure is a handful of cached pictures (the damaged body is cached per 5% step). Crowd limits on screen: 80 Petal Gates, 30 Maw Gates, 40 Healing Pods. Past a limit, or zoomed out past 0.75×, or with reduced motion, there is no flinch, breathing, motes or pulses, but gates still open and close with `b.op`. Measured with `xperf41.js`, v41 costs the same as or less than v40's procedural look for 50 to 200 of each (see the report).
- **Textures:**
  - `art/plant/petal-gate/` and `art/plant/healing-pod/`: 256x256 with the tile in the middle 128x128. `art/plant/maw-gate/`: 384x384 with the 2x2 footprint in the middle 256x256.
  - Petal Gate: `roots`, `join` (96x128), `floor`, `frame`, `petalL`, `petalR` (left petal anchored at x 86, right at 170), `wound1`, `wound2`, `mend`, `seep` (48x48).
  - Maw Gate: `roots`, `join` (96x128), `throat`, `base`, `leaf0`-`leaf5` (leaf j centred at angle j/6·2π+0.26, pivot 108 px from the centre), `wound1`, `wound2`, `mend`, `seep`.
  - Healing Pod: `roots`, `base`, `petals`, `chamber` (centre 128,124, radius 27), `gloss`, `veins`, `glow`, `mote` (32x32), `pulse` (48x48), `wound1`, `wound2`, `seep`.
  - A repainted texture must keep these anchors and centres.
- **Settings and fallback:** Low quality and painted art off give the previous look. If any file for one of the three fails to load, that structure falls back to its previous look with a console warning and the others stay painted. Build-menu icons and the placement ghost use the healthy closed picture.
- **Painter script:** `art/source/paint_gates.js` (run with `node art/source/runpaint.js art/source/paint_gates.js art/plant`). The drawing code is `drawGateP`, `drawGateM`, `drawGateUnder`, `drawPod`, `drawPodUnder`, `drawPodFx` and `podTargets` in the game.

## Painted weapons and Brood Chamber (v42): Spore Flak, Seed Mortar, Sunlance, Brood Chamber

With these four every one of the 26 hive structures is painted. The art is visual only: footprints, costs, recipes, ammunition, vigor, damage, range, accuracy, targeting, fire rate, projectiles and their speed and splash, production times, spawn positions, health, the HDF's versions and the save format are unchanged. `ident42.js` plays a walled colony with all four through a wave of flyers and ground enemies, the Brood Chamber hatching Thornbacks, and the saves are byte-identical between v41 and v42 and between art off and on (Medium and Epic). The one gameplay change in v42 is the Bulwark gate rule, described at the end of this section. Full report: `docs/v42-weapons-brood-art.md`.

- **What the game keeps (checked in the code before painting):**
  - Spore Flak (`scatter`, 2×2) and Seed Mortar (`hail`, 1×1): `b.ang` turns towards the target at 10 rad/s; a real shot sets `b.shot=G.time` and `b.reload`, and spends one round of `b.ammo`. The Flak's bullets carry `flak:true`; the Mortar's carry `art:true` and fly an arc of height `sin(kπ)·flight·18` px to the aimed point, where the game adds its `boom` effect and deals splash damage.
  - Sunlance (`lancer`, 2×2): `b.charge` rises by `dt·vigor/1.7` only while it has a live target; at 1, facing within 0.2 rad, it deals damage along its full range and adds a 0.25 s `laser` effect from its centre. It draws 40 vigor only while it has a target.
  - Brood Chamber (`factory`, 3×3): `b.wants` when it can afford its ant and is below the ant cap; `b.prog` rises by `dt·vigor/time` (Thornback 10 s, Bulwark 20 s); at 1 it pays, resets `prog` and hatches `b.unit` on `exitTile(b)`, the nearest open tile beside it towards the enemy's spawn. Changing the order also resets `prog`.
- **Spore Flak:** a broad rooted mound, seven thick lily petals and seven pale cellulose ridges round a dark well holding five translucent yellow-green spore sacs (`sac`, drawn five times), which feed a muscular launching neck (`neck`, turned to `b.ang`) with a reinforced pale rim and a launch membrane over its mouth (`iris`).
  - While it has a target and ammunition, as its next shot comes due (`1 − b.reload/0.28`) the sacs draw in and tighten (up to 11%) and the feeding veins light (`veins`).
  - On a real shot (`b.shot`): the membrane snaps shut to 40%, the neck kicks back 7 px, a puff of spores leaves the mouth (`puff`, 0.22 s) and the sacs slacken; then it all relaxes. During cooldown nothing fires.
  - At rest only the sacs breathe (2.5%, staggered).
  - Projectile: a cluster of pale green spores (`spore`, 0.55 tiles, slowly turning, with a short faint trail) in place of the line. Its burst (`burst`) replaces the orange flash the game adds where a cluster ends.
- **Seed Mortar:** a muscular root knot (`base`) holding a thick curved chamber of dark violet membrane hooped with pale cellulose and lined with fibres and channels (`chamber`, turned to `b.ang`), a reinforced pale opening (`lip`) and the next hardened seed in it (`seed`).
  - As its next shot comes due (last 0.4 s of `b.reload`, only with a target and ammunition) the chamber draws in.
  - On a real shot: the opening flares 40%, the seed is gone (it is now the game's projectile), the chamber kicks back 7 px and swells, sap mist leaves the opening (`puff`), and the chamber restores its shape over about 0.9 s. A new seed slides up into the opening 0.55 to 0.9 s after the shot, only if there is ammunition.
  - Projectile: the hardened seed capsule (`shell`, 0.6 tiles) on the game's own arc, turned along its path, with its shadow on the ground. It is hidden for its first 0.3 tiles, while still in the opening.
  - Impact: the casing splits into two halves (`half`) that fly apart and fragments burst out (`frag`), scaled to the game's splash radius, in place of the orange flash. The damage is the game's.
- **Sunlance:** a rooted mound braced by eight hardened ribs (`base`), a membrane fan (`web`) and a dish of seven large focusing petals (`petal`, violet with a translucent gold-veined window) behind a lens of luminous fluid (`lens`, gold with a pale cyan edge), all turned to `b.ang`.
  - Gathering is drawn only while the game is really charging it: a live target and vigor (`G.powSat > 0`), as far as `b.charge`. The petals close in round the lens (fan narrowing 24%, petals 12% shorter), the gold veins brighten (`veins`) and the lens lights (`glow`). Without a target or vigor the stored charge waits and the organ relaxes back to dark.
  - The beam is detected from the game's own fresh `laser` effect at this Sunlance's centre. The lens flares, then the petals spring back open and the light fades over about 0.8 s.
  - Beam (`drawLanceBeam`, in place of the plain line, only for the hive's Sunlances): from the lens front (0.31 tiles out) along the game's own beam line to its end, for the game's own 0.25 s. A wide violet glow, a gold band and a narrow white core, three pulses running along it (`bpulse`), and a small restrained flare at the end (`impact`). The HDF's Sunlance glow in High quality is kept for the HDF only.
- **Brood Chamber:** the matured Seed Pod. Thick anchoring roots, ten petals under ten cellulose ridges (`base`), and a central brood cavity (`cavity`) ringed by three translucent incubation sacs of pale nutrient fluid (`sac`) joined by nutrient vessels (`vessels`). The release opening is a pair of fleshy lips (`lipA`, `lipB`) over a dark gap (`gap`).
  - The opening sits on the side facing the tile the game would hatch onto now (`exitTile`, called as the game calls it for that ant, re-read twice a second), at 1.3× its painted size. The ring of sacs and vessels turns so the gap between two sacs faces it.
  - Growing: the sac in use (one of the two beside the opening, alternating) swells up to 14% with `b.prog` and shows the ant really being grown inside it: a Thornback form (`embT`) or a heavier Bulwark form (`embB`) for `b.unit`, growing from 40% to full size, behind a veil of the sac. It glows more as it nears completion (`sacglow`), and only while production runs does it stir and do nutrient pulses (`flow`) run along its two vessels, faster as it nears completion.
  - Hatching is detected when `prog` falls back from above 0.5 with a fresh ant of that kind on the exit tile (so a change of order is not drawn as a hatching). The lips part (0.9 s), the sac empties and the cavity pulses.
  - At rest the sacs breathe 0.8%. With no vigor or nothing to build from nothing flows or stirs (the form already grown stays visible, still).
- **Hits, damage and mends:** as on the walls and gates (`hTrack`, `gPiece`, `gAfter`). A real drop in health flinches it (Flak 5%, Mortar 6%, Sunlance 4%, Brood 3.5%) and draws a sap bead (`seep`). Cracks (`wound1`) below 92% and splits (`wound2`) below 55% are cut into the base and the moving body (neck, chamber, lens, cavity) in 5% steps. A Healing Pod repair plays `mend`. The Sunlance's petals carry no wounds, because seven copies of one wound would repeat round the dish.
- **Gameplay feedback kept:** the turret's red no-ammunition dot, range ring when selected, health bar and hit flash are drawn as before.
- **Performance:** each is a handful of image draws. Crowd limits on screen: 40 Spore Flaks, 60 Seed Mortars, 30 Sunlances, 16 Brood Chambers. Past a limit, or zoomed out past 0.75×, or with reduced motion: no breathing, puffs, flow or stirring. The Flak and Sunlance draw a cached body plus the parts that still turn to the aim, and the Mortar still shows its seed. The weapons still turn to their aim and the Sunlance still lights while charging. `xperf42.js` (headless software drawing, Medium, 0.9× zoom): single kinds within 1 to 2 ms of v41, crowds of Brood Chambers and Sunlances cheaper (100 Brood Chambers 32.0 against 43.0 ms), the active set 0.5 to 2 ms slower; on Epic 100 mixed is about 4 ms slower (29.3 against 25.1 ms).
- **Textures:**
  - `art/plant/spore-flak/` and `art/plant/sunlance/`: 384x384 with the 2x2 footprint in the middle 256x256.
  - `art/plant/seed-mortar/`: 256x256 with the tile in the middle 128x128.
  - `art/plant/brood-chamber/`: 512x512 with the 3x3 footprint in the middle 384x384.
  - Spore Flak: `roots`, `base`, `sac` (96x96, drawn at 0.62 at radius 48 px, angles k/5·2π+0.6), `neck` (mouth at x 222, aiming along +x), `iris`, `veins`, `puff` (96), `spore` (40), `burst` (96), `mend`, `wound1`, `wound2`, `seep`.
  - Seed Mortar: `roots`, `base`, `chamber` (opening at x 162), `lip`, `seed`, `puff` (64), `shell` (40, long axis along +x), `half` (40), `frag` (96), `mend`, `wound1`, `wound2`, `seep`.
  - Sunlance: `roots`, `base`, `petal` (one petal from the centre outward along +x, radius 20 to 124 px), `web`, `lens` (centre x 200, radius 26), `glow`, `veins`, `bpulse` (48), `impact` (96), `mend`, `wound1`, `wound2`, `seep`.
  - Brood Chamber: `roots`, `base`, `vessels`, `cavity`, `sac` (160, sacs 96 px from the centre at −π/2, π/6, 5π/6 before turning), `sacglow` (160), `embT` and `embB` (128, head along +x), `flow` (48), `lipA` and `lipB` (160, origin at 40,80, slit along +x), `gap` (160), `mend`, `wound1`, `wound2`, `seep`.
  - A repainted texture must keep these anchors and centres.
- **Settings and fallback:** Low quality and painted art off give the previous look (projectiles, flashes and the beam too). If any file for one of the four fails to load, that structure falls back to its previous look with a console warning and the others stay painted. Build-menu icons and the placement ghost use the resting picture.
- **Painter script:** `art/source/paint_weapons.js` (run with `node art/source/runpaint.js art/source/paint_weapons.js art/plant`). The drawing code is `drawFlak`, `drawMortar`, `drawSun`, `drawLanceBeam`, `drawBrood`, `orgUnder`, `drawSporeShot`, `drawSeedShell`, `xClassify` and `drawXBoom` in the game.

### The Bulwark Ant and the Petal Gate (v42 gameplay)

The Petal Gate is now too narrow for a Bulwark Ant, as its description always said. Mites and Thornbacks pass both gates; the Bulwark passes only the Maw Gate. The Bulwark has `large:true` in `U`. While a large ant of ours moves, plans a path, is pushed by the crowd or is placed by a hatching, a flag (`NARROW`) makes `solidFor` treat our Petal Gates as solid for it, so collision, A* routes, getting unstuck, the hatching tile and crowd pushing all keep it out. In Siege it follows its own route field (`FLOWL`, built the same way, not saved). `gateOpen` ignores large ants at a Petal Gate, so the gate stays shut for them. A Bulwark that cannot reach its goal walks to the nearest point it can reach and waits there, re-planning every few seconds, so it goes on its way as soon as a route opens. A Bulwark loaded from an older save while standing inside a Petal Gate is moved to the nearest open ground by the game's existing unstick (one short hop). The save format is unchanged.

### Root colour (v42 follow-up)

The painted root layers (`roots.png`) of all 19 growths that have them, the Bloom included, are recoloured a clear blue (the pale blue of the Brood Chamber's sacs, made bluer). `art/source/recolor_roots.py` takes each pixel's colour from a blue ramp at the same brightness and keeps its alpha, light and shade; the brighter roots of each layer are lifted into the ramp's middle and the shadows stay dark. Run it on freshly painted roots (`python3 art/source/recolor_roots.py art/plant art/plant` after repainting), not on roots it has already recoloured. Only the colour changed: sizes, anchors and every other layer are as before, and Low quality keeps the previous look.
