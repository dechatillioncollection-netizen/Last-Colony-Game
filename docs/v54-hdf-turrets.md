# v54: painted HDF defensive turrets

Screenshots are in `docs/screenshots/v54/`.

The HDF's Duo Turret, Hail Cannon, Flak Turret and Lancer are now painted, animated turrets in the same style as the v52 vehicles. HDF walls, production buildings, aircraft and vehicles are unchanged.

Nothing about how they play has changed: range, damage, fire rate, ammunition, power, targeting, projectiles, footprints, costs, collision, the HDF AI, the campaign maps, Survival, Base Siege and saves are all as in v53. Seeded games and saves are byte-identical to v53 with the art on or off, and the HDF gun sounds play at the same moments.

## What the code does (checked before painting)

| Turret | Footprint | Weapon in the game | What the art follows |
|---|---|---|---|
| Duo Turret | 1×1 | Bullets, range 8.5, every 0.32 s, ground targets. Shots alternate between two sides of the gun. | Two barrels; each shot kicks and flashes the barrel on the side the bullet left from |
| Hail Cannon | 1×1 | Artillery shells from the centre, range 15, every 1.4 s | One long gun; heavy recoil (0.75 s back to rest), big flash and smoke |
| Flak Turret | 2×2 | Flak bursts, range 13, every 0.28 s, **air targets only** | Four short barrels firing in turn, radar bar spinning |
| Lancer | 2×2 | Beam, range 11, charges over 1.7 s while the colony has power, 140 damage | Glow builds with the real charge; flare at the emitter on the real beam; fins cool after |

The HDF Flak Turret never fires in the current game: it only takes air targets, and the hive has no flying units. That is unchanged. Its firing art is ready (and tested by feeding it shot times) in case flyers are ever added.

## The four turrets

- **Duo Turret:** a compact boxy head on a turret ring, an ammunition box on its side and two separate slim barrels. A cheap, practical perimeter gun.
- **Hail Cannon:** a heavier head with a breech block, recoil cylinders and one long, thick barrel with a muzzle brake, on a foundation with braced corners. Reads as artillery, not a bigger Duo.
- **Flak Turret:** a raised octagonal mount on a 2×2 pad, four short barrels in two pairs, ammunition drums on the sides and a radar bar behind.
- **Lancer:** a long powered head with capacitor banks and cooling fins, power conduits across the foundation and one emitter barrel ending in a lens. The pale cyan light stays faint.

All four use weathered slate and steel, muted olive panels, a narrow red HDF band and yellow and black hazard stripes on the foundations.

## What moves, and what drives it

- **Aim:** the head turns with the game's own aim angle. The foundation never moves.
- **Firing:** recoil and muzzle flashes start on real shots, at the right barrel. Bullets and shells stay hidden until they clear the barrels, so they appear at the muzzle.
- **Lancer:** a faint pulse while the colony has power, a glow that rises with the game's own charge, a flare at the emitter when the beam fires, then hot fins cooling over about 1.5 s. The beam is now drawn from the emitter tip.
- **Damage:** wear marks on the foundation and head below two-thirds health, heavier damage below one-third. The hit flash now uses each turret's own outline. The health bar is unchanged.
- **Placement and destruction:** HDF turrets fade in when placed and explode with scorch marks when destroyed, as before.

## Settings, quality and fallback

- Low quality, or painted artwork off in Settings, gives the v53 look.
- If any image of a turret fails to load, that turret keeps the v53 look and the console names the missing file.
- With more than 30 turrets on screen, the soft shadows under the heads are skipped.
- With more than 80 turrets on screen, or zoomed out past 0.75×, each turret draws its foundation and one pre-baked head. Shadow, separate barrels, radar spin and smoke are skipped. Aim, flashes and damage marks stay.
- Reduced-motion system settings stop the radar spin and the smoke.

## Testing

`tests/xtest54.js` runs 31 checks, and all 31 pass. They cover:

- the art loads, and the head is drawn at the aim angle;
- the Duo's flash and recoil on the barrel the shot left from, alternating as the game alternates;
- the Hail's recoil on every real shot;
- the Flak never firing at ground units, and its four guns cycling;
- the Lancer's discharge taken from its real beam, and the beam starting at the emitter;
- shots hidden inside the barrels and shown once clear;
- both damage levels, the hit flash, the cheap mode and the fade-in when placed;
- drawing adds nothing to a block;
- art off, Low quality and a missing image;
- Low, Medium, High and Epic with 200 turrets;
- save and load, against v53;
- the Test Range and Base Siege, seeded, against v53 with art on and off, including the timing of every HDF gun sound;
- Landfall's Patrol 7 against v53 (no fighting during the encounter).

## Performance

`tests/turperf54.js` builds a dense block of 25, 50, 100 or 200 turrets (all four kinds, a third of them damaged). Every turret turns, fires, and hit-flashes every few frames, and Lancers fire beams. It times 120 frames in v53 and v54. The figures are the mean time per frame in milliseconds, in headless Chromium with software rendering. A real browser or the desktop app draws images on the graphics card, so the gap there should be smaller.

The mean is the honest figure here. The canvas records drawing cheaply and does the real work in occasional large flushes, so a typical (median) frame is only 2 to 8 ms in both versions and hides the cost.

| Turrets | Zoom | Medium v53 | Medium v54 | High v53 | High v54 | Epic v53 | Epic v54 |
|---|---|---|---|---|---|---|---|
| 25 | 2× | 9.8 | 15.7 | 9.3 | 14.3 | 16.5 | 16.1 |
| 25 | 1× | 17.6 | 19.2 | 15.2 | 16.6 | 16.7 | 18.5 |
| 25 | 0.6× | 15.0 | 16.0 | 13.4 | 14.6 | 18.6 | 15.4 |
| 50 | 2× | 18.8 | 21.4 | 17.0 | 19.3 | 18.9 | 22.6 |
| 50 | 1× | 17.7 | 21.4 | 15.8 | 19.4 | 18.4 | 19.7 |
| 50 | 0.6× | 13.9 | 15.1 | 15.8 | 14.2 | 18.0 | 17.3 |
| 100 | 2× | 27.9 | 32.0 | 23.0 | 28.8 | 22.1 | 30.5 |
| 100 | 1× | 20.4 | 24.0 | 21.0 | 21.5 | 25.8 | 23.5 |
| 100 | 0.6× | 16.8 | 17.3 | 18.9 | 17.5 | 20.4 | 20.1 |
| 200 | 2× | 32.5 | 42.5 | 32.7 | 39.8 | 36.5 | 41.4 |
| 200 | 1× | 28.1 | 34.1 | 29.9 | 31.5 | 31.2 | 34.0 |
| 200 | 0.6× | 23.0 | 23.1 | 23.0 | 23.1 | 27.7 | 26.0 |

- Zoomed out (0.6×), v54 costs about the same as v53 at every count, because each turret draws a single baked head.
- At 1× the extra cost is up to about 6 ms.
- Close up (2×) with a crowd it is highest: about 4 to 9 ms with 100 turrets and 5 to 10 ms with 200. This is with most of them on screen at once.
- Skipping the head shadows above 30 turrets on screen was added after a first run. Before that, the close-up cost with 100 turrets was about 10 ms higher.

## Regression suite

Run on the v54 build (desktop version 0.6.3):

- `tests/xtest52.js` (v52 vehicles, against v51): all pass.
- `tests/xtest53.js` (the desktop resolution guard): passes.
- `tests/elturret54.js` (new): in the packaged Linux desktop app, the painted turrets load from the app's own files and the Duo, Hail and Lancer fire with no errors. Pass.
- `tests/elveh52.js` (painted vehicles in the desktop app): pass.
- `tests/elcheck50.js`: 22 of 22 pass. Two of its checks expect a 1920×1080 virtual screen and fail on a smaller one. That is a test-setup requirement, not a game fault.

The Windows build is made from the same files as the Linux one. It was built, but it could not be run here.

## Files

- Art: `art/hdf/duo-turret/`, `hail-cannon/`, `flak-turret/`, `lancer/` (40 PNGs, about 1 MB).
- Painter script: `art/source/paint_turrets.js`.
- How the layers fit together: the "HDF defensive turrets (v54)" section of `art/ART-GUIDE.md`.
