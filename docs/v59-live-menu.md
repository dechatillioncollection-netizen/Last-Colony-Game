# v59: live main menu scenes, the Bloom's heartbeat and the two-second transition

Previews (before and after, frames, and a real-time capture with sound) are in `docs/screenshots/v59/`.

## Live scenes behind the menu

The recorded clips are gone. The menu's background is now four tiny worlds run by the game's own simulation and drawn by its own renderer, so new art, animation and behaviour show up in them by themselves.

| Scene | What happens |
|---|---|
| Living Factory | A small hive at work: Root Taps on copper, lead, coal, sand and titanium; Vines into the Bloom, a Chitin Vat and a Resin Gland; Sunleaves and a Sap Burner; a Spawning Pod hatching a few ants; a Rootweb Node, Spore Bellows and a Mender. |
| First Contact | A young Bloom on open meadow, new growths rising one after another. An HDF scout patrol crosses the ridge, stops on the rise to look, and drives on. It comes round again about every half minute, every other time with a heavier machine behind. No shots, no words, no story. This is an illustration, not the campaign's scripted scene. |
| Fortress Assault | An HDF gun post fed by its own drills and belts, with walls, Duos, a Lancer and Hails. Small groups of ants come at it from the west and its guns answer; its crews patch it, so the fight never ends with the post gone. |
| Human Frontier | An HDF mining post at work: drills on copper, lead, coal and sand, belts into the post, a smelter and generators, a pair of guns, and two patrols on the road round it. No hive in sight. |

- **Order:** Living Factory, First Contact, Fortress Assault, Human Frontier, a new one every 45 seconds. That is three calm scenes to one battle, and a battle never follows a battle. Each visit to the menu starts one scene further on. Next scene still moves on at once.
- **Changing scenes:** the view fades to dark (0.7 s), the old world is thrown away, the new one is built while dark, and it fades in. Only one world exists at any time.
- **Long stays:** with Settings open the rotation waits. A scene that has run for two minutes starts again from its beginning, so nothing in it can drift or pile up.

### Size, pace and caps

- **Map:** each world is 36×22 tiles (792), built by hand from a fixed seed. The simulation runs on that map alone. Nothing is clipped from a full map.
- **Pace:** 30 simulation steps a second. At most 30 frames a second, or fewer if the player's frame-rate limit is lower; Unlimited and 240 do not raise it.
- **Resolution:** the scene draws at 60% of the screen's resolution. It sits under the menu's shade, and this nearly halves its cost.
- **Caps:** at most 10 ants (8 hatched), 6 machines, 70 shots, 90 effects and 40 marks.
- **Health bars, messages, the drop zone ring and the end of a game** never appear in a scene.

### Kept apart from the game

- The world is never the game's state. The game's state is set to it only while it is stepped and drawn, so input, the HUD, saves, autosave, the story, radio and achievements never see it. `window.__game()` returns nothing on the menu.
- Nothing is saved while a scene runs. The only thing written is which scene was shown, as before.
- Keys and clicks land on the menu, never on the scene, and the game's HUD stays hidden behind it.
- **When a game starts or loads:** the world is thrown away first, with its sounds and every leftover in the renderer's lists. The game then sets its own full map size.
- **When the menu closes** (campaign map, intro, a game) the world goes too.

### When it does no work at all

- **Hidden window or tab:** nothing is stepped or drawn until it comes back.
- **Settings > Moving menu background off:** no world exists. The scene's still picture shows instead.
- **Reduced motion:** stills, as before.
- **A scene that fails to build or run:** its still shows, and the console says why. After two failures the menu keeps to stills for that visit.
- **A computer that cannot keep up:** if the scene's frames take more than 45 ms, or fewer than 18 frames a second reach the screen, for two spells of about ten seconds, the menu switches to stills for the rest of the visit.

### Still pictures

`art/menu/factory.jpg`, `frontier.jpg`, `assault.jpg` and `human.jpg` are frames of the live scenes themselves, rendered by `tests/stills59.js`. The old clips (`.webm` and `.mp4`, 24 MB in all), `skirmish.jpg`, and the recorder and its scene file are removed.

### Sound

- The scene is heard through the game's own mixer, with the same sounds as a game, following the Sound effects, Ambience and Master sliders and Mute all sound.
- Its effects play at about half volume and its ambience a little lower, so the menu stays calm.
- Nothing is heard until the first key or click (the one that leaves the title). Under the title the scene waits silently.
- At a scene change the sound fades down and up with the picture. A game starts at full volume.

## The title's heartbeat

Every 5 to 8 seconds the Bloom, and only the Bloom, contracts twice like a heart:

| | |
|---|---|
| Lub | tightens by 3 to 4% over 100 to 140 ms, then lets go over 170 to 230 ms |
| Dub | peaks 180 to 260 ms after the lub, a little stronger (up to 5%) and quicker |
| Recovery | a slight give past rest over 450 to 750 ms |

- **How:** the Bloom is redrawn in 14 rings, each drawn smaller toward its centre by the amount the beat gives at that distance. The middle squeezes most, the petal tips least, and the picture beyond the Bloom never moves.
- **Removed:** v58's swell of the whole picture, the lift of the LAST COLONY title, the flush of light and the warm tint over the screen.
- **Light:** a wave runs out along the conduits after each beat, the second one fainter.
- **Variety:** each beat's timing and strength are drawn afresh within those ranges.
- **Sound:** `title_lub` and `title_dub`, muffled as if heard through flesh and soil, each started so it lands on its own peak. They play through the ambience volume. In a browser they are heard once a key has been pressed; the desktop app plays them from the start.
- **Reduced motion:** the Bloom does not move. Its heart glows faintly with each beat instead.

## Continuing from the title

Any key, mouse button or controller button now runs a two-second transition, timed by the wall clock, so a slow computer only draws fewer frames along the way:

| Time | What happens |
|---|---|
| 0 to 0.15 s | The edges darken at once, the key has been heard, and the prompt fades. |
| 0.1 to 0.8 s | Seven broad, tapered, dark-plum tendrils (five on a narrow screen) grow in along curves: three from below and two from each side. Each is aimed past the middle, so they cross. They writhe slightly, with vessels along them, a dark shadow side and a wet sheen. Translucent veined membranes bloom between neighbouring tendrils, and a flesh-dark ground closes in behind them. |
| 0.85 s | Nothing of the title shows. |
| 0.9 s | The title is put away and the menu is underneath, its scene already built and drawn. |
| 1.05 to 1.85 s | The membranes tear open from the middle in a ragged hole with a wet, catching edge, while the tendrils peel back to their edges. |
| 1.85 to 2.05 s | What is left fades, and the menu has the keyboard on Campaign. |

- **Skipping:** a second press goes straight to the menu. It does not reach the menu's buttons.
- **Drawing:** fresh each frame on its own canvas at three quarters of the screen's resolution, not from the game's tile vines.
- **Sound:** `title_open` (2.4 s) through the sound effects volume: a soft thump, tendrils sliding and creaking, a dull seal as the membranes close, the stretch and sticky tear as they peel back, and a breath of air.
- **Reduced motion:** a 200 ms crossfade.
- **Smoothness:** the menu's scene is drawn a few times out of sight while the title shows, so its first visible frame is quick. While the membranes peel back it is drawn but not yet stepped, because new Rootweb growth is the one thing that can stall a frame on a computer drawing in software.

## Performance

Measured on this build machine, which has no graphics card, so Chromium and the desktop app draw everything in software. Processor use is summed over every process (100% is one core), over 10 to 12 quiet seconds. On a computer with a graphics card, drawing the scene costs far less; a recorded clip was also decoded in software here.

| | v58 menu, recorded clip | v59 live scene (calm) | v59 live scene (battle) | v59 still menu | Survival battle (60 machines, 20 guns) |
|---|---|---|---|---|---|
| Browser, processor (`tests/menuperf59.js`) | 57% | 85 to 120% | 90% | 4% | 115% |
| Desktop app, processor (`tests/elmenu59.js`) | 50% | 64% | 69% | 2.5% | 63% |
| Desktop app, memory | 1,299 MB | 1,211 MB | 1,196 MB | 1,204 MB | 1,168 MB |
| Page script heap | 2.2 MB | 3.7 to 5.9 MB | 4.0 MB | 2.1 MB | 6.3 MB |

- **Against the clips:** a live scene costs more processor than playing a clip did here, about a third more in the desktop app and up to twice as much in the browser, because it draws a real game frame 30 times a second. It uses about 90 MB less memory in the desktop app, with no video decoder loaded.
- **Against a game:** a live scene costs about what a large battle does here, so the computer that runs the game runs its menu.
- **Download:** the clips (24 MB) are gone, so the game is 24 MB smaller.
- **What cut the cost:** drawing at 60% resolution (about a third less work per frame), 30 frames a second at most, and nothing at all when hidden or switched off.
- **Thirty minutes left alone** (`tests/idle59.js`, `tests/idle59.json`): 40 scenes built and thrown away. The script heap after a garbage collection stayed between 6.1 and 7.1 MB (6.62 MB on average over the first ten minutes, 6.89 MB over the last ten), and the page held 1,899 to 1,946 DOM nodes. It held 30 steps and 29 to 30 frames a second throughout, with at most 8 ants and 6 shots, and no errors. This run used the build before the last two smoothness changes (drawing the scene out of sight under the title, and not stepping it during the peel), neither of which runs while the menu sits idle.
- **Time to the menu's buttons:** about 1.7 to 3 seconds from opening the page, against 1.9 seconds for v58. A scene takes 150 to 460 ms to build, under the title or a dark fade.

The raw figures are in `tests/perf59.json`, `tests/elperf59.json` and `tests/idle59.json`.

## Tests

- `tests/xtest59.js` (new, 45 checks) covers the live scenes, the heartbeat and the transition. See `tests/README.md`.
- `tests/elmenu59.js` (new) covers the desktop app and its processor and memory figures.
- `tests/idle59.js` (new) leaves the menu alone for 30 minutes.
- `tests/menuperf59.js` (new) gives the browser figures.
- `tests/xtest56.js` is updated for live scenes, and `xtest55.js` and `xtest57.js` pass unchanged.
- `xtest58.js`, `elvines58.js`, `elmenu56.js` and `menuperf56.js` are removed; they tested the clips and the vines.
- The gameplay regressions (`lcquick`, `lcskir`, `lcstory`, `lcheld`, `lcsave`, `lctest`, `lcart`, `lcbloom`, `lchd`, `lcspit`, `lcweb`) give the same results as v58, apart from the run-to-run differences of their unseeded games.
