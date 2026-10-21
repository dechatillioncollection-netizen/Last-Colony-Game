# v49: the intro cinematic, second pass

This is the v48 intro, reworked after a review of its 61-second recording so that it reads as one unfolding awakening. The engine, skip, replay, save rules and hand-off into Landfall are unchanged from v48 (see `docs/v48-intro-cinematic.md`). What changed:

- the timeline;
- the transitions between scenes;
- the organism's progression;
- the human presence;
- the captions;
- the sound.

Nothing about how the game plays has changed.

Screenshots are in `docs/screenshots/v49-intro/`. `00-contact-sheet.jpg` shows every scene on one page.

## Scene order and timestamps

The scenes run once each, in this order, and never cut back. The test checks every 0.1 s and records the scene changes at 7.9 s, 17.9 s and 50.4 s. From 20 s to 50 s the camera never leaves the organism.

| Time (s) | Scene | What happens | Words |
|---|---|---|---|
| 0–8 | 1 Nereth | The planet from orbit, lower in the frame so the title sits on space. The camera closes in, enters the haze at 5.4 s and the cloud at 6.6 s, and comes out of it over the meadow. | 1.2–6.6 "NERETH" / "Human Frontier Territory" |
| 8–18 | 2 An occupied world | The real Landfall meadow, closer than before (zoom 1.35 to 1). A survey truck drives west along the track, raising dust. Three surveyors in hi-vis jackets and white helmets stand at the tripod, at a marker (holding a survey staff) and by the parked truck. Beside the second marker there is a fresh survey pit with a spoil heap and stakes. At 15.4 s the far-off drilling arrives as a faint shiver of dust and a distant resonance. The camera then sinks towards the hollow where the Bloom will be. | Radio: 9.4 SURVEY TWO "Control, Survey Two. Marker forty-one is in. Moving west along the track." 13.4 FRONTIER CONTROL "Copy, Survey Two. Drill crew hit hard rock past the ridge. Expect some noise out your way." |
| 18–30 | 3 The forgotten organism | The meadow dissolves into a cut-away of the same ground. Daylight and grass are at the top, and the camera sinks through the soil to the dormant cluster. It is almost motionless: a dim glow, sacs barely breathing, dust motes almost still. One faint flicker comes at 26.6 s. | 22.6 "Dark." 26.2 "Still." |
| 30–40 | 4 The disturbance | 30.4 s: a low resonance passes through the rock, the ground trembles slightly and grit trickles down. 32.6 s: the first strong internal pulse, with a wave of light passing out through the cluster and its own low organic sound. 35 s onward: the tendril bases twitch. 37 s: a second, weaker resonance. | 31 "Pressure." 36.4 "Movement." |
| 40–53 | 5 Awakening and emergence | 40 s: fluid starts moving along the vascular channels and the pulses quicken. 43 s: the tendrils extend and the membranes ripple. 44.4 s: the main root climbs towards the surface, and from 45.6 s each pulse sends nutrients up it. The camera follows the root up, the Bloom's bud pushes into the topsoil, and at 50.4 s the cut-away dissolves into the surface seen from above. Each pulse then opens the Rootweb a step further around the real Bloom, and its edge brightens with the pulse. | 42.6 "Reach." 45.8 "Hunger." Radio: 51 SURVEY TWO "Control, Survey Two. Heading back to camp before dark." |
| 53–60.4 | 6 Landfall | The camera eases from a close view of the new Bloom to the normal Landfall camera. The letterbox opens at 58.6 s, and the Root-Link opening and tutorial start exactly as before. | 54.8–58.6 "MISSION 1" / "LANDFALL" |

The whole intro now runs 60.4 s instead of 61 s, and the hand-off happens at 58.6 s instead of 58 s.

## The organism's five states

Two seeded functions of the clock drive everything the organism does. `introAwake(t)` gives its overall state, and `introPulse(t)` gives the pulse train (`INTRO_PULSES`). Glow, vascular flow, membrane movement, tendril growth, dust movement and the vignette are all read from them.

| State | From | Wakefulness (`introAwake`) | What you see |
|---|---|---|---|
| Dormant | 18 s | 0 | Dim glow, sacs breathing very slowly, no flow, motes almost still, one barely visible flicker (pulse strength 0.12) |
| Disturbed | 32.6 s | 0.12 | One strong pulse (strength 1) and a single wave of light; tendril bases twitch from 35 s |
| Stirring | 40 s | 0.4 by 43 s | Fluid moves along the vascular channels; pulses every 1.0–1.2 s, growing stronger |
| Awakening | 43–44 s | 0.75 by 47 s | Tendrils reach out; membranes ripple; the main root climbs |
| Emergence | 46–48 s | 1 by 51 s | Nutrients travel up the root on each pulse; the bud breaks the surface; each pulse opens more Rootweb above |

The tests sample these and check that:

- the state never goes backwards;
- each state is clearly above the one before;
- nothing stronger than a faint flicker happens before the disturbance.

The effects stay restrained: no flashes, no particle bursts, and only the slight tremor (switched off under reduced motion).

## Captions

- **Fewer words.** One radio line was cut ("Copy. Quiet out here otherwise."). There are now three radio lines and six single-word instincts.
- **Which words.** The instincts stay "Dark.", "Still.", "Pressure.", "Movement.", "Reach." and "Hunger." The review suggested "Warmth.", "Root." and "Feed. Grow.", but the Root-Link opening that follows already says "Light... warmth.", "Root." and "Feed. Grow. Spread." Using them here would repeat its lines.
- **Accuracy fix.** The first radio line now says the truck is moving west, which matches what the picture shows.
- **Larger text.** At 1920×1080:
  - radio text is 22 px (it was 17 px), with a 14 px speaker label;
  - instincts are 42 px (they were 30 px);
  - the title is 60 px.

  Sizes scale down to 15 px (radio) and 24 px (instincts) on small screens.
- **Contrast.** The text is brighter and has a tight dark outline plus a soft shadow.
  - Radio lines sit on a dark panel (66% black).
  - Titles and instincts sit on a soft dark halo that fades out at the edges, so there is no hard box.
- **Measured contrast.** At 1920×1080, 1280×720 and 390×844, every caption was checked at the middle of its time on screen against the brightest 10% of the picture behind it. The halo was counted at less than its real centre value, to be conservative. All captions reach at least 4.5:1. The lowest was "MISSION 1" at 1280×720 (4.5:1). Most captions are above 9:1.
- **Narrow screens.** The radio line also moves up on narrow screens, so the Skip button never covers it.

## Sound

Three new recipes were added (177 sounds in all, 4.79 MB):

| Sound | Length | What it is | Where |
|---|---|---|---|
| `intro_wake` | 3.6 s | One deep, slow organic pulse: a soft low push through dense tissue with a damp after-swell | 32.5 s, on the first strong pulse |
| `intro_rise` | 3.8 s | Nutrients moving up a long channel: a slow rising breath of fluid, no pitch | 46.6 s, as the first nutrients travel up the root |
| `intro_life` | 16 s loop | The organism awake: a low, living, breathing room tone | Fades in from 40.2 s to 0.45, rises to 0.8 at 48.8 s, then fades out at 53.4 s |

Other changes:

- **Pulses.** The underground bed rises from 0.55 to 0.8 at 40 s, so the ambience builds as the organism wakes. The tissue pulses follow the pulse train.
- **Drilling.** The distant drilling is heard three times: faintly in the meadow at 15.4 s, right after the radio warning; strongly as the disturbance at 30.4 s; and weaker at 37 s.
- **No new stingers.** There is no percussion and no musical impact.
- **Tonal check.** The new sounds measure 10.8–11.8 dB on the tonal check (plain noise is about 10–12).
- **Settings.** As before, everything plays through the game's mixer, so Master, Effects, Ambience and Mute all apply.

## Architecture changes

- **Where the code lives.** `intro49.js` replaces the v48 module in the build (`x49patch.py`), and `intro49_parts.py` generates it from `intro48.js`. The controller, skip, replay, save rules, sound plumbing, orbit, ground and soil code are the same.
- **New data.**
  - `INTRO_PULSES`: the pulse train.
  - `INTRO_REVEAL`: the pulses that open the surface.
  - `introAwake` and `introPulse`: the state functions.
  - `INTRO.root`: the main root's path.
  - `INTRO.crew` and `INTRO.pit`: the surveyors and the survey pit. Each is placed on the nearest open tile, never on rock or water.
- **Transitions are cross-dissolves.**
  - The meadow dissolves into the underground scene (17.8–19.6 s), and the underground scene dissolves into the surface (50.4–51.8 s).
  - There are no fades through black between scenes any more.
  - The game's own render runs from 50.4 s, when the underground scene starts to fade.
- **Surface reveal.** The opening at the surface grows in steps, one per reveal pulse, instead of as one smooth widening.

## Results

**`tests/xtest49.js`: 60 of 60 pass.** It includes everything in `xtest48.js`, re-timed to the new scenes, plus:

- **Scene order:** the scenes run once each, in order, and never cut back; from 20 s to 50 s only the underground scene is drawn.
- **States:** the organism's states are distinct and increasing (0, 0.12, 0.4, 0.75, 1).
- **Pulses and sound:** the pulse peak before the disturbance is at most 0.15, and the first strong pulse is at least 0.9. The `intro_wake` sound plays within 0.1 s of that pulse.
- **Surface reveal:** every step of the opening at the surface is triggered by a pulse.
- **No duplication:** after the intro, Landfall has the same Bloom, Rootweb (120 tiles) and object count as a launch without the intro, so nothing is made twice.
- **Captions:** the contrast and size checks at three screen sizes pass.
- **Skip:** skipping at 1, 12, 25, 31, 35, 45, 50.8, 55, 59 and 60.2 s (Esc, Enter, the button, Tab then Space, and a double press) always starts Landfall once, at game time 0, with the normal camera and no intro sound left playing.
- **Hand-off and replay:** the full real-time play hands over to the Root-Link opening and tutorial Step 1 with its ten steps. Replay intro leaves the campaign unchanged.
- **Older saves:** older campaigns and loaded saves never get the intro.

**Performance.** Draw cost per frame, in ms:

| Quality | Orbit | Meadow | Under | Waking | Surface |
|---|---|---|---|---|---|
| High | 6.1 | 0.2 | 1.0 | 0.7 | 0.3 |
| Low | 2.6 | 0.1 | 0.6 | 0.4 | 0.2 |

In real-time play the median frame was 16.7 ms (the display rate) and the 95th percentile was 33 ms, measured in headless Chromium while the test was also polling the page.

**`tests/elcheck48.js` in the Windows app: passes.** It works with the new build without changes. Thirteen intro sounds decode offline from `file://`, Esc hands over to the Root-Link opening once, and Replay intro leaves the campaign unchanged.

**Full regression (`runreg49.sh`, 54 runs).** Every test has the same exit status as v48's run.

- **Simulation identical.** Mission set-up, waves, combat and saves are identical to v47 (`ident_v47`: 7 of 7, and the Bulwark variant: 4 of 4) and to v48 (`ident_v48`: 7 of 7, and the Bulwark variant: 4 of 4). The local web server stopped near the end of the run, so the two v48 identity checks were run again straight afterwards. These are the results shown.
- **`lcstory` and `xtest46`.** Both start a new campaign from Launch and skip the intro with Esc. Both pass.

**Known flaky tests, unchanged from v48:**

- **`wbtest` check 05 (ore window edge).** Its map layout is not fully seeded, so the result varies between runs. It passed in this run.
- **`wbtest` check 11 (Rootweb coverage performance) with GL=2.** It also fails in the v47 and v48 runs.
- **Older version suites.** The `xtest37` to `xtest45` suites have the same failure counts as in v48's run.
