# v58: the title's heartbeat, the vines, and sound for the menu scenes

Screenshots are in `docs/screenshots/v58/`.

## The title screen's heartbeat

Every 5 to 8 seconds the Bloom beats like a heart: a strong beat and a lighter one 0.3 seconds later.

- **The picture:** with each beat it swells by about 1%, and the Bloom flushes with light. A faint warm tint passes over the whole screen, and the LAST COLONY title lifts slightly.
- **The light:** the wave that runs out along the conduits still starts with the first beat.
- **The sound:** `title_heart`, a deep, damp "lub-dub" through the ambience volume. It replaces the soft pulse from v55.
- **When you hear it:** in the desktop app from the start. In a browser, sound only starts with the first key or click.
- **Reduced motion:** the picture and title do not swell; the light still beats.

## The vines

Any key, mouse button or controller button that used to fade the title now grows vines over it. The whole thing takes 7 seconds.

| Time | What happens |
|---|---|
| 0 to 4.4 s | Vines grow in from every edge, more each second, each steering for a point on the screen. They curl, branch up to three times and thin as they go. Thorns, leaves and glowing buds (teal and violet) appear along them. The prompt fades at once. |
| 0.6 to 4.8 s | Dark undergrowth closes in from the edges behind them, until nothing of the title shows. |
| 5.6 s | The vines part from the middle, swelling slightly as they open onto the main menu. The title's sound bed fades out, and the menu's scene starts with its sound. |
| 7 s | The main menu, with the keyboard on Campaign as before. |

- **Skipping:** a second press opens the vines at once, and a third goes straight to the menu. Neither press reaches the menu.
- **Clock:** the vines keep to real time, so a slow computer still reaches the menu in 7 seconds. It only draws fewer frames along the way.
- **Sound:** `title_vines` (7.4 s) plays through the sound effects volume:
  - soil splitting;
  - a rising mass of fibrous creaks, rustles and wet squelches;
  - a deep thud as the vines meet;
  - the tear and breath of them parting at 5.6 s.
- **Sound in a browser:** the browser's sound starts on the same key press, so the title's sounds are loaded first. The vine sound starts as soon as it is ready, from wherever the vines have got to.
- **Reduced motion:** no vines. The title fades to the menu as in v55.
- **Drawing:** on their own canvas above the title. Each frame adds only the new length of each vine to a kept layer, as one path per vine so no seams show.

## Sound for the menu scenes

The four clips now have the game's own sound, recorded with them:

- **Living Factory:** root taps, glands, Sap Burners and Sunleaves, with the Rootweb creeping.
- **Quiet Frontier:** the patrol's engines passing.
- **Fortress Skirmish:** the ants' and guns' fire and impacts.
- **Human Frontier:** the colony at work.

Each scene has its world's ambience under it.

### How it was recorded

`art/source/rec_menu.js` records the picture and the sound in one run:

- **The mixer:** the game's own mixer (every sound, engine, organ bed and the ambience) is built on an `OfflineAudioContext`.
- **The clock:** the recorder moves that context's clock with the frames, so each sound lands on the frame that caused it.
- **Settling:** the ambience runs 6 seconds before the clip starts, so it has settled.
- **The loop:** the sound is blended at the loop exactly as the picture is.
- **Levels:** all four clips are set to the same loudness (-21 LUFS) and encoded as Opus (96 kbit/s) in the WebM and AAC (128 kbit/s) in the MP4.
- **Size:** the four clips are about 24 MB in all, up from 19 MB.

### In the menu

- **When it plays:** sound plays once sound is allowed: after the title screen's key in a browser, at once in the desktop app. Until then a clip plays muted.
- **Volume:** the clip's sound goes through the **Ambience** and **Master** volumes and **Mute all sound**. At the default settings it plays at the level it was recorded.
- **Scene changes:** the old clip's sound fades out as its picture does, and the new one's fades in.
- **The menu's own ambience** (wind and deep air) drops to a quarter while a clip is heard.
- **Silence:** still pictures (Moving menu background off, reduced motion, or a clip that fails) are silent, and the menu's ambience plays as before.

## Measured

On this build machine (no graphics card), in the desktop app:

- **Vines:** from the key to the menu in 7.0 seconds.
- **Processor:** the menu with its moving, sounding background used 47% (`tests/elmenu56.js`), against 44% in v56. The still menu used 3%.

## Files

- `index.html`: the heartbeat (`splashBeat`), the vines (`VN`, `vineStart`, `vineTick`, `vineSkip`, `vineDone`), and the clip sound (`mmAudioOK`, `mmHeard` and the volume in `mmTick`).
- `audio/source/sounds.js`: `title_heart` and `title_vines`. `audio/sounds.js` now holds 180 sounds.
- `art/source/rec_menu.js`: the sound recording. `art/menu/*`: all four clips recorded again.
- Tests:
  - `tests/xtest58.js` (browser) and `tests/elvines58.js` (desktop app).
  - `tests/xtest55.js`, `tests/xtest56.js` and `tests/elmenu56.js` now wait for the vines and expect the clips' sound.
