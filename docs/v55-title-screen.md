# v55: the title screen

Screenshots are in `docs/screenshots/v55/`.

Last Colony now opens on a title screen. It shows once when the game launches. Any key, mouse button or controller button fades it into the main menu, which is unchanged. Nothing about play, saves, the campaign or settings has changed.

## The picture

The camera looks straight down at night on a dark marsh on Nereth, the same view the game is played from.

- **The Bloom:** at the centre a dormant Bloom rests in a still pool among lily pads. It is the game's own painted Bloom, drawn large.
- **The Rootweb:** conduits creep out from it across the wet ground, with beads of pale light along them. A few Seed Pods glow where they reach.
- **The water:** the pools reflect the stars and a faint band of the galaxy.
- **People:** at the far top right, half lost in the dark, a survey track runs past. A Scout Tank is stopped on it with its lamps turned toward the marsh, and a line of survey stakes blinks amber. It is the only sign of people.

The mood is quiet and a little uneasy: something old and alive that has not fully woken, with people at the edge of it.

What moves:

- A slow breath of light in the conduits.
- Every 6.5 to 9 seconds, a wave of light that runs outward from the Bloom along the Rootweb.
- The Bloom's heart glowing and dimming.
- Fog drifting across the marsh.
- Spores rising.
- The survey lamps blinking down the line.
- A very slow push-in of the camera.

The title **LAST COLONY** is in the game's own display face, with a soft violet and teal glow and a thin rule beneath it. "Press any key to continue" fades in after about two seconds near the bottom and breathes gently. The desktop app shows its version in the bottom-right corner.

## How it works

- **When it shows:** once per launch, in the browser and in the desktop app. Backing out to the main menu, returning from a match, or quitting to the menu never brings it back.
- **The main menu is already underneath.** Continuing fades the title screen out over 0.9 seconds, revealing the menu, and puts keyboard focus on its first button. There is no separate menu screen and no change to how the menu starts.
- **Input:**
  - Any key counts, except Shift, Ctrl, Alt, the system key, Caps Lock, Tab, F11 and F12. Those are left for full screen and the like.
  - Any mouse button or touch counts.
  - Any controller button counts, as long as it was not already held when the game launched.
  - The press that continues is used up. It does not also click the menu button under the pointer, and it does not reach the game's own keys.
- **Starting another way:** if a game starts without the menu (a loaded save, or a test script), the title screen is removed at once.
- **Test browsers:** automated browsers skip the title screen, so older tests that click the menu keep working. A test can ask for it with `localStorage.lc_splash = '1'`. The desktop app always shows it.

## Sound

- **Under the title:** the menu's own ambience plays as before: wind over the ground and the deep air. The title adds the low bed from under the ground in the opening cinematic, and a soft pulse with each wave of light.
- **Volume:** everything goes through the master and ambience volumes. Nothing from combat is used.
- **Continuing:** the extra bed fades out over about a second and a half, leaving the menu ambience.
- **Browsers:** a browser does not allow any sound until the first key or click, so in a browser the title screen is silent and its sound starts with the press that continues. The desktop app plays it from the start.

## Quality, sizes and fallback

- **Sizes:** the picture fills any window shape. The Bloom is kept below the title on tall or narrow screens. The title and prompt scale with the window.
- **Checked:** from 2560×1440 down to a phone held upright (390×844).
- **Low quality:** fewer spores, no fog, and a simpler light wave.
- **Reduced motion:** reduced-motion system settings stop the push-in, the spores' drift and the prompt's breathing.
- **Missing art:** if `art/title/bg.jpg` or `glow.png` fails to load, the screen is dark with the title and prompt, works the same, and the console names the missing file.

## Files

- `art/title/bg.jpg`: the picture, 2560×1440, about 0.26 MB.
- `art/title/glow.png`: what gives off light, 1280×720.
- `art/title/meta.json`: positions the screen animates.
- `art/source/paint_title.js`: the painter, which draws the scene with the game's own Bloom, Seed Pod and Scout Tank art.
- `art/source/runtitle.js`: runs the painter in the game page. Start a web server on the repo root first.
- In the game file: the `#splash` element and the `splash…` functions near the end of the script.

## Testing

`tests/xtest55.js`: 30 checks, and all pass. They cover:

- shown on launch over the menu, with its art;
- a modifier key alone does not continue;
- any key continues and does not reach the game;
- the menu is focused afterwards, and Settings, the campaign map and backing out all work;
- a mouse click does not press the menu button under it;
- a controller button held at launch does not count, and a new press continues;
- a game started another way removes it;
- automated browsers skip it unless asked;
- six window sizes;
- missing art;
- the sound bed through the ambience bus, fading on continue;
- Low quality and reduced motion.

`tests/elsplash55.js` checks the packaged Linux desktop app: the title shows with its art from the app's files, its sound starts at once, the version shows, and Enter fades it into the menu.

`tests/elcheck50.js` now goes past the title screen before its menu checks.
