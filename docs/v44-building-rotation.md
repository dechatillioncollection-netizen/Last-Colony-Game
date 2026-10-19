# v44: building rotation and turning vine lines

v44 adds mouse-wheel rotation, in the way Mindustry's desktop controls work. The change is in the one game file (`index.html`), with no change to the art or to save files.

## Research: how Mindustry does it

These notes come from the Mindustry source (Anuken/Mindustry, GPLv3, commit 84fd6bf): `core/src/mindustry/input/DesktopInput.java` and `InputHandler.java`. Only the ideas are used; no code was copied.

| Mindustry | Line | Last Colony v44 |
|---|---|---|
| The rotate binding is the scroll axis. Each tap adds or subtracts one quarter turn (`rotation = Mathf.mod(rotation + axisTap(rotate), 4)`). | `DesktopInput` 836–837 | Each wheel notch turns a quarter: wheel down is clockwise, wheel up is anticlockwise, and it wraps round. R and Shift+R do the same, as before. |
| Scroll zooms the camera only when no rotatable block is being placed (`!isPlacing() \|\| !block.rotate`). With one chosen, scroll rotates and does not zoom. | 478–481 | The wheel rotates only while a Vine or Swift Vine is chosen, and that wheel event never zooms. With nothing chosen, or a symmetrical organ, or reabsorb, the wheel zooms exactly as in v43. |
| Only blocks with `rotate` use the rotation. Symmetrical blocks place the same whatever the rotation is. | `Block.rotate` | In Last Colony only the Vine and the Swift Vine have a direction (`rot:true`). The Vine Knot, Splitter Bulb and Sorting Gland work from whichever side items come in, and the other organs are symmetrical, so none of them turn. |
| During a line drag, the first scroll sets the rotation to the drag's own direction and switches on `overrideLineRotation`; the same tap then turns it. From then on every block in the line takes that rotation. With the diagonal key held, the override is ignored and each conveyor faces the next. | `DesktopInput` 762–769, `InputHandler.iterateLine` 2479–2511 | The same. The first notch during a vine drag turns the whole line a quarter from the way you are dragging, and every vine in the preview and in the placed line faces the chosen way. With Ctrl (our staircase key) held, the staircase keeps its own turns. Let go of Ctrl and the chosen direction applies. |
| The line plan is rebuilt as soon as the rotation changes (`updateLine`). | 843–844 | The preview's plan is cached on the direction too, so it is rebuilt on the same frame. |

## The rules as built

- **Before placement:** with a Vine or Swift Vine chosen, the wheel turns the hover preview a quarter per notch. The preview shows the vine sprite facing that way, an arrow, and a small green tip on the side it will feed (red if the tile is refused). The tip eases round over about a tenth of a second, so a turn reads at a glance. The sprite and the plan snap at once, so what you see is what will be placed.
- **Placing:** a click places the vine facing the previewed direction. It is a growing site like any other, with the same growth time, cost and checks.
- **During a drag:** the wheel turns the whole line. All the tiles keep their route, and each vine faces the chosen way. That lets you lay a row of vines side by side that all feed one way, or reverse a line. The label adds "line turned", and the direction holds as the drag goes on. After you release, the next Vine starts facing the way the line faced, as it did in v43.
- **Unchanged:**
  - Rotation goes through the same planner, evaluation and placement as v43.
  - The 5-tile vine reach, affordability (refused tiles are never charged), construction order and timed growth are all as before.
  - A tile that is refused (rock, occupied, out of reach, not affordable) stays refused in every direction.
- **Touchpads:** a notched wheel turns one step per notch. Small pixel scrolls add up to a step every 60 px, so a touchpad flick doesn't spin the vine round.
- **Saves:** a vine's direction was already saved (`rot`). A half-grown turned vine loads with its direction and growth. Older saves load unchanged.

## Controls

| Input | With a Vine or Swift Vine chosen | Otherwise |
|---|---|---|
| Wheel down | Turn clockwise (during a drag: the whole line) | Zoom out |
| Wheel up | Turn anticlockwise (during a drag: the whole line) | Zoom in |
| R / Shift+R | Same as wheel down / up | R / Shift+R turn the stored direction, as before |
| Ctrl during a drag | Staircase; the turned direction waits until Ctrl is let go | — |
| Esc during a drag | Cancel: nothing placed, nothing paid | — |

## Tests

- **New:** `tests/xtest44.js` has 33 checks, all passing in headless Chromium with real mouse and wheel input. It covers the items the brief listed: clockwise and anticlockwise turning, placement direction, the drag preview turning, the placed and grown direction (and items leaving each vine the way it faces), the 5-tile reach, timed growth, invalid tiles staying invalid, and the other controls (zoom identical to v43, Esc, Ctrl, right-click, save).
- **Windows app:** `tests/elcheck44.js` ran in the packaged app (Electron 33.2.1) with real wheel input. Wheel down and up turned the Vine without zooming, a click placed it facing the chosen way, a drag turned with the wheel previewed and grew as 6 north-facing vines, and with no Vine chosen the wheel zoomed. There were no page errors.
- **Regression:** all 39 suites ran, and every one gives the same result as v43, check for check. That includes xtest43's 71 checks. The v43 to v44 save-identity run (`ident42.js` with `OLD=lc2_v43_index.html`, normal and Bulwark) says "ALL PASS: identical saves". The suites that already differed from older builds in v43 differ in exactly the same checks. `wbtest` with WebGL 2 gave 15 of 17 once and 16 of 17 (the v43 result) on a rerun. That test seeds `Math.random` but not the game's own random source, so its maps change between runs.
- **Responsiveness:** `tests/xperf44.js` measured one wheel step during a 41-tile drag, including turning the line, rebuilding the plan and redrawing. The median was 12.2 ms, against 14.7 ms for an unchanged frame measured the same way. The two are within noise: the regression was running on the same machine during the measurement.
