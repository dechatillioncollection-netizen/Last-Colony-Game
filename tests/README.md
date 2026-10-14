# Tests

Browser tests driven by Playwright (Chromium). Run them from the repository root so they find `index.html` and `art/`.

```
npm i -g playwright            # or set PW to an existing playwright module path
python3 -m http.server 8123 &  # some tests load the game over http so canvases are not tainted
node tests/wbtest.js           # Living Rootweb checks, writes wbtest_result.json
node tests/lcquick.js          # quick gameplay regression
```

| Script | What it checks |
| --- | --- |
| `wbtest.js` | Living Rootweb: coverage, leaks, save and load, HD modes, toggle, fallback, gameplay identity |
| `wbdet.js` | deterministic no-combat survival run, for comparing builds |
| `realprof.js`, `wbprof.js`, `crowdprof.js`, `cowtest.js` | frame-time profiling of the real game loop |
| `wbdeliver.js` | screenshots of the Rootweb used in the art guide |
| `lcskir`, `lcquick`, `lcstory`, `lcheld`, `lcsave`, `lctest`, `lcart`, `lcbloom`, `lcweb`, `lchd`, `lcspit` | gameplay, story, saves, art and HD regressions |

`lcspit.js` has a known intermittent failure on some random maps that also happens on older builds.
