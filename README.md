# Last Colony

A colony defence and factory game where you play the Nymbri Hive, a living plant colony trying to survive the Human Defence Force.

The whole game is a single HTML file with its painted art beside it. The ground and the living Rootweb are drawn with WebGL 2 on High and Epic quality, with the 2D canvas as an automatic fallback.

## Play

Open `index.html` in a browser. Chrome, Edge and Firefox all work. Painted art loads from `art/` and sound from `audio/`, so keep those folders next to the page. If the browser blocks local files, serve the folder instead:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Opened straight from disk, Chrome won't let WebGL read the art, so the game falls back to drawing the Rootweb on the processor. Serving the folder avoids that.

Press F3 in game to see the frame rate and which renderer is drawing the Rootweb. Settings > Frame rate limit caps the frame rate at 30, 60, 80, 120 or 240, or lifts it (Unlimited; above the screen refresh only in the desktop app, after a restart).

## What is here

| Path | Contents |
| --- | --- |
| `index.html` | the game: engine, campaign, survival, siege, test range, saves |
| `art/plant/` | painted layers for the Bloom, Seed Pod, Thorn Spitter and Living Rootweb |
| `art/source/` | the scripts that paint those layers |
| `art/ART-GUIDE.md` | how the painted art is layered, animated and scaled |
| `audio/` | the game's sounds (`sounds.js`, loaded after the first click) and the scripts that generate them, see `audio/README.md` |
| `docs/` | campaign dialogue, game guide, campaign maps (`v34-campaign-maps.md`), test range layout, screenshots |
| `electron/` | the desktop app for Steam, itch.io and direct download: Windows, Linux and macOS (`electron/build.sh`; see `docs/v50-desktop-steam.md`) |
| `tests/` | Playwright tests and profilers, see `tests/README.md` |

## Notes

The story bible is kept outside this repository (it holds private story direction).
