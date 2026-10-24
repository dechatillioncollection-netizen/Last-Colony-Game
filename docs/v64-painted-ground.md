# v64: the painted ground

The ground and the ore are now painted once, before play, from brushes, instead of being drawn tile by tile. The pictures are in
`docs/screenshots/v64/`: each `<view>.jpg` is v63 on the left and v64 on the right, at the same place and zoom, and each
`after_<view>.jpg` is the v64 frame on its own. Campaign: `landfall_*`, `ember_base`, `frost_*`, `last_base`. Random maps:
`survival_*`, `siege_*`. The views are the normal zoom (`base`), the ore at 1.4× (`ore`), the ore close up at 2.5× (`ore_close`) and
zoomed out to 0.5× (`far`).

The game itself is unchanged: movement, placement, construction, harvesting, map sizes, pathfinding, the Rootweb, combat and saves
are exactly as in v63 (checked against v63 by `tests/xtest64.js`, below). Only the picture of the ground changed.

## 1. How the ground is made

Whenever a map is made (a campaign sector, a random map, a loaded save, the Test Range, a menu scene) the whole ground is painted
once into chunk canvases of 1024×1024 pixels, layer by layer, and then nothing is painted again until the next map. Each frame only
copies the chunks in view (2D drawing) or samples them as textures (the graphics-card path).

**Brush shapes from fields, not tiles.** Every region (sand, water, ore, rock, and every patch of ground colour) is a brush shape
traced from a smooth field: for terrain, the tiles blurred and eased between their centres plus two scales of noise; for patches, a
slow warped noise; for a sector's own painted ground, a wobbly ellipse. The outline is where the field crosses a threshold, traced on
a quarter-tile lattice and chained into closed loops, so a region's border wanders freely across tile edges. Tracks and roads are
strokes of irregular brush stamps turned along the line. Soft edges are laid as several rings at rising strength, so patches blend
into each other with no hard rim.

**The outline still follows the game's tiles.** Tiles the game counts as rock, water, sand or ore are held over the threshold and
the tiles around them under it, so the outline always runs between their centres: every such tile's centre is inside its painted
region, every other tile's centre outside, and in practice the edge strays less than a quarter tile from the true tile edge (checked
on five maps at five points per tile, no exceptions). A lone tile still shows, rounded.

**Materials.** Each region is filled with a seamless painted material, generated once per resolution: moss, dry grass, dirt, mud,
soil, lichen, dust, gravel, sand, frozen grit, ash, cinder, scorch, snow, frozen ground, ice, packed earth, concrete, five stones and
four ore beds. They are made from noise, Voronoi cells (rock is split into faceted slabs with cracks of varying depth) and painted
marks (blades, stones, specks, cracks), lit from the top left.

**Layers, in order:** the biome's base material, broad soft tints of light and shade, the palette's ground patches, the sector's own
painted ground (with dirt under every survey track and gravel along every road, and packed or frozen ground under every prop), sand,
water (a wet bank, depth towards the middle, a light lip), ore, rock (a soft shadow cast down and right, then light across its body),
scattered detail (stones, tufts, flowers, ash, frost, twigs) that keeps off rock, water, ore and props, and finally the sector's
tracks, roads, scorch marks and props.

**Ore** is a stained patch of ground, a broken bed in the ore's own colours and a scatter of faceted mineral pieces (titanium as
crystals), three to five a tile, that may lean a little over the tile edge but never off the deposit. Copper reads copper-orange,
lead violet-grey, coal black, titanium pale blue; sand ore is the sand terrain. The deposit's footprint is the bed's outline.

**Palettes.** Each campaign biome has its own: Landfall meadow (moss, dry grass, dirt, a survey area of packed ground), Ember ash
(ash, cinder, scorch, dust along the haul road, the concrete depot yard), Kilo pass (dirt, gravel scree under the mountains, the
outpost's packed yard), Frost (snow, frozen ground, ice on the lakes, frozen grit for sand) and the Last Colony (packed ground,
gravel, concrete through the colony district). Random maps pick one of four palettes (base, meadow, mountain pass, ash) from the map's
seed, so a saved game always repaints the same. The menu scenes use the meadow.

**Campaign paint data.** Each sector in `MISSIONS` has a new `paint` list: `['blob', material, x, y, rx, ry, alpha]` or
`['path', material, points, half width, alpha]`, in tiles. Mirrored sectors mirror it; `paintPost` holds paint for one side only
(the Last Colony's district). Nothing else in the sector data changed, and nothing new is saved.

**The 2D and graphics-card paths** both use the same chunks. On the graphics card each chunk is a mipmapped texture; in 2D each chunk
also keeps a half-size copy, used when zoomed out so far that a screen pixel covers more than about two painted pixels.

**Quality presets** set how many painted pixels each tile gets: Low 20, Medium 28, High 36, Epic 44, Ultra 52, held down on the
largest maps so the whole ground stays within 4608×4608. Low also lays soft edges in three rings instead of six and lights rock
once instead of twice. The style is the same on every preset; only the sharpness changes.

**Small dynamic marks** (scorch and wreck stains left during play) are now soft, ragged splotches instead of squares. They are drawn
over the ground each frame as before and never repaint it.

Removed: the per-tile classic ground (`drawTile`, its canvas) and the per-pixel HD ground (`hdCanvas`); `buildHDTerrain` remains as a
name for the new bake.

## 2. Performance

Measured in headless Chromium with software drawing (no graphics card), so a real computer is faster. Bake time is the whole
painting of the ground, done once when a map is made:

| Map (tiles) | Low | Medium | High | Epic |
| --- | --- | --- | --- | --- |
| Landfall (72×72) | 231 ms (20 px a tile) | 432 ms (28) | 501 ms (36) | 698 ms (44) |
| Ember Fields (84×84) | 362 ms | 603 ms | 788 ms | 977 ms |
| Outpost Kilo (96×96) | 487 ms | 787 ms | 1022 ms | 1246 ms |
| Frost Canyon (96×96) | 351 ms | 559 ms | 810 ms | 1145 ms |
| The Last Colony (144×144) | 912 ms | 1778 ms | 2102 ms (32) | 2083 ms (32) |
| Survival (96×96) | 457 ms | 837 ms | 1163 ms | 1273 ms |
| Base Siege (144×144) | 1063 ms | 1940 ms | 2243 ms (32) | 2164 ms (32) |

For comparison, starting a game in v63 at High took 0.3 s (Landfall) to 1.0 s (Last Colony, Base Siege) in total on the same machine;
v64 adds about 0.5 to 1.5 s to that, once, before play. The materials are made once per resolution and kept, so a second map at the
same preset starts a little faster. The biggest costs are the soft-edged ground patches and the rock's light and shadow.

**During play nothing is painted**: a frame copies the chunks in view. A Survival frame at High (2D drawing, 1280×800) took
8.1 / 5.1 / 4.3 ms at zoom 0.6 / 1 / 2 against v63's 10.6 / 6.5 / 5.5 ms in the same run (`xtest64` #12; these vary by a millisecond
or two between runs, and v64 was never slower). The menu scenes draw in the same time as v63 (16.5 against 15.5 ms at 1×, 33 against
33 ms at 2×).

**Memory**: the painted ground is held at full and half size. At High that is about 34 MB for Landfall and 106 MB for a 144-tile map
(against 21 MB for v63's HD ground on the largest map), within the 4608×4608 cap on every preset. On the graphics-card path the
chunks are also held as textures.

## 3. Tests

`tests/xtest64.js` (76 checks, all passing) covers the brief's list:

| Brief | Checked by |
| --- | --- |
| 1 campaign maps load with their painted ground | each of the five sectors painted with its own palette, and its own paint visibly changes the ground under it |
| 2 random maps painted before play | Survival, Base Siege and the Test Range have their chunks painted when the game starts, before the first step |
| 3 no repainting during play | no chunk painted in two minutes of play drawn at three zooms |
| 4 stable through a match | every chunk's pixels identical before and after those two minutes |
| 5, 20 aligned with the tiles | every rock, water, sand and ore tile's centre inside its region and every other tile's outside, plus points a quarter tile in from each side, on five maps: no exceptions |
| 6, 7 better ground, natural transitions | each biome's ground its own colour; the screenshots |
| 8 ore upgraded and readable | each ore type's mean colour well apart from the others; the screenshots |
| 9 no visible tile boundaries | over open ground, colour changes across tile edges are no stronger than across the middle of tiles (ratio 1.01 to 1.02) |
| 10 zoom | Low to Epic at 0.5×, 1× and 2.5× (half-size copies when far out), screenshots of each |
| 11 bake time | under 4 s at High on every map in software drawing (see the table) |
| 12 frame cost | a Survival frame at 0.6×, 1× and 2× zoom no dearer than v63's |
| 13 stability | menu, campaign map, a sector, back to the menu and a random map in a row with no errors |
| 16, 17, 18 game logic, harvesting, placement | the same map sizes, terrain and ore as v63 on all five sectors and both random modes; Rootweb Nodes and Root Taps allowed on the same tiles; a seeded three-minute Survival match with Root Taps on ore ends in the same save as v63's |
| 19 saves | a v64 save repaints exactly the ground it was played on; a v63 save loads in v64 and paints the same ground every time; a v64 save loads in v63 |
| 14, 15 Windows and web builds | the release build below |

The older regression tests were run too. `lcquick`, `lcsave`, `lchd`, `lcart`, `lcweb`, `lcbloom`, `mtest` (18/18 campaign mission checks), `wbtest` (17/17 Rootweb
checks, including gameplay identity), `xtest61` all pass. `xtest60` and `xtest63` each have one timing check on the title-to-menu
transition that is flaky on this machine: `xtest60`'s fails the same way on v63 (13.9 frames a second against a limit of 14), and
`xtest63`'s passed and failed at 1× and 2× on different runs, with the menu itself drawing as fast as v63's. `xtest52` and `xtest54`
need the v51 and v53 pages, which are not on this machine.

What could not be checked here: this machine has no Windows and no graphics card, so the graphics-card path was checked for one
texture per chunk in software WebGL only, and timings are for software drawing.
