# v52: painted HDF ground vehicles

Screenshots are in `docs/screenshots/v52/`.

The Scout Tank, Rammer Drone, Flame Tank and Siege Tank are now painted, animated vehicles. HDF buildings and aircraft are unchanged.

Nothing about how they play has changed: health, speed, size, collision, damage, range, shots, targeting, spawning, the campaign scripts and saves are all as in v51. Seeded games and saves are byte-identical to v51 with the art on or off.

## The four vehicles

| Vehicle | Look | How you tell it apart |
|---|---|---|
| Scout Tank | Narrow khaki hull on thin open tracks, small cast turret with a slim gun, sensor pod, smoke dischargers, whip antenna | Light colour, open tracks, the antenna |
| Rammer Drone | Low wedge body on four exposed wheels on sprung arms, a heavy V plough with teeth, two red charge drums, a red beacon | Smallest, wheels, yellow and black plough, no turret |
| Flame Tank | Wide and squat, layered glacis blackened by flame, bolted skirts, two red-banded fuel cylinders with hoses, squat turret, short twin projector with a heat shroud | Wide body, fuel tanks on the back, short nozzles |
| Siege Tank | Very broad tracks between skirt plates, stepped armour, engine grilles and exhaust stacks, folded outriggers, big octagonal turret, long gun with a muzzle brake | Biggest, long gun |

Bosses are drawn 1.35× as before. They add extra armour plates and red command markings.

## What moves, and what drives it

All motion comes from what the game is really doing:

- **Tracks and wheels** run by the distance the vehicle actually moved, so they stop when it stops. In a turn the outer track runs further. The Rammer's front wheels steer into turns.
- **The hull** turns toward the direction of travel at its own rate (the Siege Tank turns slowest), so it never snaps round.
- **The turret** follows the game's aim angle.
- **Firing** happens on a real shot:
  - The Scout and Siege guns recoil and recover, with a muzzle flash and a puff of gun smoke. The Siege Tank's hull also rocks.
  - The Flame Tank's projector flares while it is really spraying. The flame is drawn from its nozzles to the game's own target point.
- **Damage:**
  - Below two-thirds health: scuffs, bullet strikes, dents, a scorch and thin smoke.
  - Below one-third health: holes, torn plates, heavy smoke and an ember glow.
  - The hit flash and health bar work as before.
- **Destruction:** a kill leaves a burnt wreck, and a Rammer's blast leaves scattered debris. A wreck burns for about 5 seconds and fades by 10. A scripted vehicle that drives off (Patrol 7) leaves nothing.
- **Idle:** exhaust puffs and a faint engine shake. A Siege Tank that has stood still for about a second lowers its outriggers, and raises them when it moves.

## Settings, quality and fallback

- Low quality, or painted artwork off in Settings, gives the v51 look.
- If any image of a vehicle fails to load, that vehicle keeps the v51 look and the console names the missing file.
- With more than 45 vehicles on screen, or zoomed out past 0.75×, each vehicle draws a baked hull with its tracks and a baked turret with its gun. Smoke and the antenna are skipped. Tracks, turning, aim, recoil, flashes and damage marks stay.
- Reduced-motion system settings skip smoke and the idle shake.

## Testing

`tests/xtest52.js` runs 29 checks, and all 29 pass. They cover:

- the art loads;
- tracks are still at rest and run forward together;
- the hull eases into turns, and the outer track runs further;
- the turret slews to the aim;
- recoil starts on a real shot, and the flame comes from the nozzles;
- both damage levels, the hit flash and the boss overlays;
- drawing adds nothing to an enemy;
- wrecks appear for a kill and a blast but not for a scripted removal, then fade;
- the outriggers;
- cheap mode;
- a missing image and art off;
- Low, Medium, High and Epic with 70 vehicles;
- Landfall's Patrol 7 against v51 (it walks its survey track, stops, talks and withdraws, step for step and save for save);
- three seeded Survival waves against v51, with art on and off.

`tests/elveh52.js` checks the vehicles in the packaged Linux desktop app (pass), and `tests/elcheck50.js` still passes all 22 checks on the v52 build (version 0.6.1).

The per-vehicle demos were also run in v51 and v52, and their final game states matched exactly.

## Performance

`tests/vehperf52.js` draws 70 vehicles, all on screen, with every one hit-flashing every third frame. The figures are the mean time per frame in headless Chromium with software rendering. A real browser or the desktop app draws images on the graphics card, so the gap there should be smaller.

| Quality | Zoom | v51 | v52 |
|---|---|---|---|
| Medium | 2× | 17.6 ms | 27.2 ms |
| Medium | 1× | 15.1 ms | 20.5 ms |
| Medium | 0.6× | 14.8 ms | 15.7 ms |
| High | 2× | 18.8 ms | 27.3 ms |
| High | 1× | 15.3 ms | 21.1 ms |
| High | 0.6× | 13.5 ms | 15.5 ms |
| Epic | 2× | 19.7 ms | 28.0 ms |
| Epic | 1× | 16.8 ms | 19.7 ms |
| Epic | 0.6× | 18.3 ms | 19.8 ms |

The cost is highest close up with a big wave on screen. To keep it down, each image is cropped to what is painted and kept at full, half and quarter size, and crowds use the baked images.

## Files

- Art: `art/hdf/scout-tank/`, `rammer-drone/`, `flame-tank/`, `siege-tank/` (64 PNGs, about 0.8 MB).
- Painter script: `art/source/paint_vehicles.js`.
- How the layers fit together: the "HDF ground vehicles (v52)" section of `art/ART-GUIDE.md`.
