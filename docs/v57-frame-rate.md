# v57: frame rate limit

Screenshot: `docs/screenshots/v57/settings-frame-rate.png`.

## Why the game ran at 60

The game draws a frame each time the browser offers one (`requestAnimationFrame`), and the browser offers exactly one per screen refresh. Most screens refresh 60 times a second, so the game drew 60. Nothing in the game set that number. On a 144 Hz screen it already drew 144.

## The setting

Settings > **Frame rate limit**: Screen, 30, 60, 80, 120, 240 or Unlimited. It is kept in `localStorage` (`lc_fps`).

- **Screen** is the default and the old behaviour: one frame per refresh.
- **30 to 240** are upper limits. A frame the screen offers sooner than the limit allows is skipped before anything is stepped or drawn. The limiter keeps its own clock (it adds one interval per frame rather than restarting from each frame), so on a 144 Hz screen a 120 limit really gives 120, not 72.
- **Unlimited** draws every frame on offer.
- **Game speed never changes.** The world is stepped on its fixed clock from the real time that passed, so a lower limit makes the picture less smooth and nothing else.
- **The steady frame rate guard** in the desktop app aims for the limit, so a 30 limit is not read as a slow computer that needs a lower resolution.
- **The note** under the row says what the choice does and, on the web, the screen's rate as measured (the quickest tenth of the last 120 refreshes).

## Above the screen's refresh

A browser cannot draw more frames than the screen refreshes, so on the web 80 and up only help on a screen that fast; the note says so.

The desktop app can go past it. Choosing 80 or more, or Unlimited, saves the choice to `fps.json` in the app's settings folder. At its next start the app turns off Chromium's frame limit and vsync (`disable-frame-rate-limit`, `disable-gpu-vsync`). Until then the note asks for a restart; afterwards it says the screen refresh limit is off, which can show tearing. Going back to Screen, 30 or 60 turns the limit back on at the next start.

## Measured

On this build machine, which has no graphics card (everything drawn in software):

| | Frames a second |
|---|---|
| Browser, game at Screen | about 50 (the machine cannot keep 60) |
| Browser, game at 30 | 30.0, world speed 1.00 |
| Desktop app, Survival game, limit on | 27 |
| Desktop app, same game, Unlimited after a restart | 140 |

## Files

- `index.html`: the row, the limiter (`FPSL`, `fpsSkip`, `fpsSet`, `fpsUI`).
- `electron/main.js`: reads `fps.json` at start-up; `app:setFps` saves it. `electron/preload.js`: `lcDesktop.uncapped` and `lcDesktop.setFps`.
- Tests: `tests/xtest57.js` (browser), `tests/elfps57.js` (desktop app).
