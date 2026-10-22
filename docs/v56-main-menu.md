# v56: the main menu

Screenshots are in `docs/screenshots/v56/`.

The main menu is now a dark rail down the left of the screen, over scenes from the game playing silently behind it. The title screen from v55 still comes first. Every menu entry is the same, in the same order, and does the same thing. Play, saves, the campaign, the intro and the settings are unchanged.

## The menu

- **The rail:** a dark, slightly see-through panel down the left, about a third of the width on a computer. It holds the LAST COLONY title, the tagline and the buttons: Campaign, Survival, Base Siege, Load Game, Settings, and Quit in the desktop app. Each keeps its description.
- **How to play:** the three play tips and the controls line that used to sit above and below the buttons are still there, word for word, in a How to play fold at the foot of the rail.
- **Look:** slate black and navy, off-white text, violet for edges and the hovered button, and a few touches of warning yellow (the bar above the title, the marker on the chosen button, the focus ring).
- **Buttons:** a hovered or focused button lifts with a violet wash, a yellow marker and a slight slide. Keyboard focus also gets a yellow ring.
- **Foot of the screen:** the name of the scene playing ("Background scene: Living Factory"), a Next scene button, and in the desktop app the version.
- **Phones and narrow windows:** the rail takes the whole width on a solid dark backing and the buttons get taller, at least 58 pixels.
- **Wide screens:** the rail is capped at 760 pixels, and the scenes fill the rest at any shape, ultrawide included.

## The scenes

Four scenes, each a 30-second loop recorded from the game itself: the real map, growths, machines, renderer and painted art at Epic quality, with no interface, messages, fog of war or range rings.

| Scene | What happens | Kind |
|---|---|---|
| Living Factory | The main showcase. A Bloom at the heart of a working colony: Root Taps and Deep Roots on every ore, Vines and Swift Vines full of copper, lead, titanium and resin running through Splitter Bulbs into a Chitin Vat, Resin Gland, Spore Flak and three Thorn Spitters, Sunleaves and Sap Burners, Spawning Pods and a Brood Chamber, a Rootweb Node and Spore Bellows, ants about. No enemies. | calm |
| Quiet Frontier | A young Bloom on open meadow with two taps and a few Sunleaves. A Rootweb Node has just been planted at the edge and its Rootweb spreads out over the clip. Far off along the ridge, an HDF survey patrol of two Scout Tanks and a Flame Tank drives past and out of sight. Nothing comes of it. | calm |
| Fortress Skirmish | Thornback, Bulwark and Mite Ants push at the west gun line of the last colony in small groups, and its Duo Turrets, Lancer and Hail Cannons answer while a few machines roll out. Never more than ten ants at once. | battle |
| Human Frontier | The last colony at work from its own side: drills, belts full of ore, presses, smelters and generators, with patrols on the perimeter road. No hive in sight. | calm |

- **Order:** Living Factory, Quiet Frontier, Fortress Skirmish, Human Frontier, then round again. That is three calm scenes to one battle, and the battle never follows itself.
- **Changing:** a scene plays through once (30 seconds) and crossfades to the next over 1.4 seconds. Each visit to the menu starts one scene further on. The change waits while Settings or Saves is open. Next scene moves on at once. The background never takes clicks.
- **Loops:** each clip's last 1.5 seconds are blended into its first, so it loops without a cut.
- **Story:** none. No Patrol 7, no dialogue, no campaign map, nothing from later in the story.

## How it works, and why recorded clips

The brief allowed either recorded clips or small live demo games running behind the menu. After going through the code, the menu uses **clips recorded from the game**:

- **Nothing runs behind the menu.** The whole game runs through one global game state (`G`). A live demo would have to be that state, and the main loop, autosave, the radio, the story, the HUD and the sound all read it. Keeping a demo from leaking into any of them would mean changing the engine, which the brief rules out. A clip cannot touch a save or a setting.
- **Cheaper:** decoding one video is far less work than simulating and drawing a colony, especially at Epic with the painted art (see Performance below).
- **Looks the same everywhere:** the clips show the game at Epic quality even on a computer that plays at Low.
- **Exactly repeatable:** each scene is built from a fixed seed and a hand-laid layout, and the recorder steps it on its own clock, frame by frame, so recording again gives the same clip.

What it costs:

- **Size:** about 19 MB of files in `art/menu/` (both video formats and the stills). This adds to the download and the desktop app.
- **Re-recording:** a clip does not change by itself when the art or the game changes. It has to be recorded again (one command, below).
- **Image quality:** video compression softens fine detail a little; behind the rail's vignette it does not show.
- **Fixed view:** each clip has one camera path; a live scene could vary.

### The recorder

`art/source/menu_scenes.js` builds each scene inside the game page. Each scene is a demo game:

- **Built:** a fixed seed, the Bloom moved to the middle of the map, a hand-laid layout, no waves, no fog of war, everything paid for.
- **Run:** stepped by the recorder only. The page's own loop is kept from stepping it, and it is warmed up first (up to 40 seconds) so the vines are already full.
- **Patrols:** use the game's own scripted movement, the same one Patrol 7 uses, which guns ignore. They fire nothing.
- **Camera:** a slow closed path, with the point of interest right of centre so it sits clear of the rail. The Human Frontier camera stands still, because its moving belts already make it the largest clip.

`art/source/rec_menu.js` builds a scene and draws each frame with the game's renderer at 1920×1080 and 30 frames a second. ffmpeg then:

- blends the end into the start;
- encodes a WebM (VP9) at 1920×1080 and an MP4 (H.264) at 960×540;
- takes a still from four seconds in.

To record again, start a web server on the repo root (`python3 -m http.server 8123`), then run `node art/source/rec_menu.js` for all four scenes or `node art/source/rec_menu.js factory` for one. Add `--stills` to check the framing first.

### In the game

- **One clip at a time:** the menu plays one muted `<video>` (WebM, with the MP4 as a second source) and only loads the next scene's clip four seconds before it is needed. The old clip is unloaded after each crossfade.
- **Under the title screen:** the first clip's picture shows at once, so the title fades onto it, but the clip only starts playing as the title fades.
- **When it stops:**
  - Starting a game or opening the campaign map unloads the clips altogether.
  - A hidden tab or minimised window pauses the clip.
  - The end-of-game cards that reuse the overlay are not the main menu and have no background.
- **Fallbacks:**
  - If a clip will not play (no file, an unsupported format, autoplay refused, or not started after six seconds), its still picture takes its place and the console says why. After two such failures the menu uses stills for the rest of the session.
  - If a still is missing too, the menu stands on a dark backdrop. Every button works either way.
- **Moving menu background (Settings):** on by default. Off shows each scene's still picture instead, changing once per visit to the menu.
- **Reduced motion:** a reduced-motion system setting does the same as turning it off.

## Sound

The clips are silent. They have no sound track and are muted, including the battle, so the menu never plays weapons. The menu's sound is the same gentle ambience bed as before, wind over the ground and the deep air, through the master and ambience volumes and Mute all sound. The title screen's extra bed still fades out on continuing, so the two never stack. In a game the menu bed gives way to the game's own ambience as before. Turning the ambience down or off is done with the Ambience slider in Settings; there is no second mute button.

## Keyboard and accessibility

- **Buttons:** real buttons, in their old order. Tab and Shift+Tab move through them, then How to play and Next scene. Up and down arrows also step through the buttons, wrapping round.
- **Escape:**
  - Escape closes Settings and Saves, as before, and the keyboard goes back to the button that opened them.
  - Escape on the campaign map now goes back to the main menu, as its Main menu button does.
- **Screen readers:** the rail is a region named "Main menu", and the background is hidden from them.
- **Title prompt:** "Press any key to continue" now appears only once the title picture has loaded (or failed), so it never shows while the screen is still coming in. Pressing earlier still continues.

## Performance

Measured on this build machine, which has no graphics card: Chromium and the desktop app draw and decode video in software here. The figures are processor use summed over every process (100% is one core), over 8 to 10 quiet seconds. On a computer with a graphics card the video is decoded in hardware, so the moving menu should cost less than shown.

| | v55 menu | v56, moving background | v56, still background | Survival battle (60 machines, 20 guns) |
|---|---|---|---|---|
| Browser (`tests/menuperf56.js`) | 39% | 47% | 3% | 114% |
| Desktop app (`tests/elmenu56.js`) | not measured | 44% | 3% | 65% |

- **Why the still menu is cheaper than v55's:** the game's canvas under the menu was being cleared every frame with no game running. It is now cleared once, so a still menu costs almost nothing.
- **The moving menu** decodes one 1080p clip. That costs about as much as the old menu in the browser, and well under a battle in both.
- **Memory:** the page's script heap stays at about 2 MB with or without the clips. The desktop app uses about 90 MB more with a clip loaded (1,236 MB in all against 1,145 MB with the still).
- **Time to the menu:** about 1.6 seconds from opening the page to working buttons, the same as v55. The first clip starts within a few milliseconds of that.
- **Desktop title prompt:** in the desktop app the title prompt was ready after 5.6 seconds under the virtual display, including the app's own start-up.
- **Changing scenes:** never more than two clips are loaded (only during a crossfade).

The raw figures are in `tests/perf56.json` and `tests/elperf56.json`.

## Files

- **Clips:** `art/menu/factory`, `frontier`, `skirmish` and `human`, each as `.webm` (VP9, 1920×1080, 30 seconds), `.mp4` (H.264, 960×540) and `.jpg` (the still).
- **Recorder:** `art/source/menu_scenes.js` (the scenes) and `art/source/rec_menu.js` (the recorder).
- **Tests:**
  - `tests/xtest56.js`: the menu in the browser.
  - `tests/menuperf56.js`: the figures above.
  - `tests/elmenu56.js`: the desktop app.
