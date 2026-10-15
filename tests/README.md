# Tests

Browser tests driven by Playwright (Chromium). Run them from the repository root so they find `index.html` and `art/`.

```
npm i -g playwright            # or set PW to an existing playwright module path
python3 -m http.server 8123 &  # some tests load the game over http so canvases are not tainted
node tests/wbtest.js           # Living Rootweb checks, writes wbtest_result.json
node tests/lcquick.js          # quick gameplay regression
node tests/vtest.js            # Painted Vines checks
OLD=http://localhost:8123/previous/index.html node tests/otest.js   # Painted organs checks (previous build copied to previous/)
```

| Script | What it checks |
| --- | --- |
| `wbtest.js` | Living Rootweb: coverage, leaks, save and load, HD modes, quality presets, fallback, gameplay identity. `GL=2` runs it on the GPU renderer, `GL=0` on the 2D painter |
| `vtest.js` | Painted Vines: the 14 checks (single vine, seams on straights, turns and Swift joins, Knot streams, every resource on top, Root Tap to Bloom, zoom, art on/off identity, runtime preset switch, missing PNGs, save and load). Writes `vtest_result.json` |
| `vperf.js` | Painted Vines against the previous vines: drawing cost for networks of 100, 500 and 1,000 vessels at three zooms |
| `otest.js` | Painted organs (Splitter Bulb, Sorting Gland, Resin Gland, Rootweb Node): 13 checks, including the same colony in the previous build and this one with art on and off giving byte-identical saves. Set `OLD` to the previous build's URL. Writes `otest_result.json` |
| `operf.js` | Painted organs against the previous look: drawing cost with 12 to 300 of each on screen, at two zooms |
| `qtest.js` | graphics quality presets: menu access, each preset's effect, persistence, migration from older settings |
| `glcmp.js`, `glgrow.js` | GPU and 2D Rootweb side by side, and GPU growth frames |
| `glcpu.js` | processor time per frame for the Rootweb on each path |
| `wbdet.js` | deterministic no-combat survival run, for comparing builds |
| `realprof.js`, `wbprof.js`, `crowdprof.js`, `cowtest.js` | frame-time profiling of the real game loop |
| `wbdeliver.js` | screenshots of the Rootweb used in the art guide |
| `lcskir`, `lcquick`, `lcstory`, `lcheld`, `lcsave`, `lctest`, `lcart`, `lcbloom`, `lcweb`, `lchd`, `lcspit` | gameplay, story, saves, art and HD regressions |

Headless Chromium only has software WebGL, so frame times measured on the GPU path (case 11 in `wbtest.js` with `GL=2`) are not meaningful there.

`lcspit.js` has a known intermittent failure on some random maps that also happens on older builds.
