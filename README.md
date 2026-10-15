# Last Colony

A colony defence and factory game where you play the Nymbri Hive, a living plant colony trying to survive the Human Defence Force.

The whole game is a single HTML file with its painted art beside it. The ground and the living Rootweb are drawn with WebGL 2 on High and Epic quality, with the 2D canvas as an automatic fallback.

## Play

Open `index.html` in a browser. Chrome, Edge and Firefox all work. Painted art loads from `art/`, so keep that folder next to the page. If the browser blocks local files, serve the folder instead:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Opened straight from disk, Chrome won't let WebGL read the art, so the game falls back to drawing the Rootweb on the processor. Serving the folder avoids that.

Press F3 in game to see the frame rate and which renderer is drawing the Rootweb.

## What is here

| Path | Contents |
| --- | --- |
| `index.html` | the game: engine, campaign, survival, siege, test range, saves |
| `art/plant/` | painted layers for the Bloom, Seed Pod, Thorn Spitter and Living Rootweb |
| `art/source/` | the scripts that paint those layers |
| `art/ART-GUIDE.md` | how the painted art is layered, animated and scaled |
| `docs/` | story bible, campaign dialogue, game guide, campaign maps (`v34-campaign-maps.md`), test range layout, screenshots |
| `electron/` | the Windows desktop build (`electron/build.sh` makes `LastColony-Windows.zip`) |
| `tests/` | Playwright tests and profilers, see `tests/README.md` |

## Notes

`docs/story-bible.txt` section 6 is a private long-term twist. Keep it out of player-facing text.
