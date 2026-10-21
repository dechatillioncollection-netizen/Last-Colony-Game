# v48: the intro cinematic

A one-minute opening drawn live in the game's own Canvas. It plays the first time a new campaign launches Landfall and ends at the exact moment Landfall begins. Nereth is seen from orbit, then the Landfall meadow where a survey crew is at work. The view goes down into the soil, where something old and dormant stirs after a distant resonance passes through the rock. It comes back up as the first Bloom opens, and the camera settles where every Landfall game starts. There is no video file and no new rendering pipeline.

Nothing about how the game plays has changed: weapons, enemies, maps, Rootweb limits, tutorial gates and building rules are all as they were. The proof is in Results (the simulation is identical to v47).

Screenshots of every scene are in `docs/screenshots/v48-intro/`. `00-contact-sheet.jpg` shows all of them on one page.

## What the player sees

| Time (s) | Scene | Picture | Words on screen | Sound |
|---|---|---|---|---|
| 0–10.6 | 1 Orbit | Starfield; Nereth (the campaign globe's own texture) grows slowly, with atmosphere, a drifting cloud layer and a terminator; haze as the camera enters the air | 1.4–7.4 "NERETH" / "Human Frontier Territory" | Low orbital hum, faint radio static |
| 8.4–22 | 2 Frontier | The real Landfall map from above: rocks, ore, the eastern survey track and its markers, a survey truck driving west along the track with dust behind it, cloud shadows; the camera drifts towards the Bloom's site and sinks | Radio: 10.2 SURVEY TWO "Control, Survey Two. Marker forty-one is in. Moving east along the track." 14.2 FRONTIER CONTROL "Copy, Survey Two. Drill crew hit hard rock past the ridge. Expect some noise out your way." 17.9 SURVEY TWO "Copy. Quiet out here otherwise." | Meadow ambience, a distant engine, radio clicks |
| 19.6–32 | 3 Beneath the soil | A cross-section of damp strata, stones, dead roots and seams; falling grit; the dormant cluster of translucent violet sacs with faint vascular strands, pulsing slowly | 22.2 "Dark." 25.4 "Still." 28.8 "Pressure." | Deep underground bed, soil settling, a rare slow pulse |
| 32–48 | 4 Awakening | 32.4 and 38.4: a low resonance passes through the rock (a gentle tremor, off under reduced motion). The sacs swell, the pulse quickens, fluid runs along the strands and branching Rootweb tendrils grow outward | 35.2 "Movement." 40.2 "Reach." 44.6 "Hunger." | Distant drill-like resonance, quickening pulses, Rootweb creep |
| 48–58 | 5 First Bloom | The camera rises through the soil; the ground parts and the real Bloom and its first patch of Rootweb show through, lit from within; the meadow around it is empty | 52.6 SURVEY TWO "Control, Survey Two. Heading back to camp before dark." | Meadow returns, the Bloom opening, a faint far-off radio |
| 58–61 | 6 Into Landfall | The letterbox opens and the camera is now the game's own; the interface fades back in | 58.3 "MISSION 1" / "LANDFALL" | The meadow fades into the game's own ambience |

Then the Root-Link opening plays exactly as before ("Light... warmth." first), followed by the tutorial's Step 1, Patrol 7 after Step 10, and so on. The intro's words were chosen not to repeat the Root-Link lines ("Root.", "Feed. Grow. Spread.", "Something old, deep down"). The humans never see the hive, never name it and never sound alarmed. The drilling is only a remark on the radio and a resonance underground; nothing says it caused the awakening. The instincts are single words with no "I".

Every caption stays on screen for at least 2.3 seconds and fades over 1 second. Nothing flashes, and camera moves are slow eases. The tremor is a slight shake of the underground view and is switched off when the system asks for reduced motion.

## First play, skip and replay

**First play.** Pressing Launch on Landfall plays the intro when all of these are true:

- the campaign was created in v48 or later (`CAMP.flags.v48`, set by `freshCamp`);
- the intro has not been seen (`CAMP.flags.intro`);
- the tutorial has not been finished (`flags.tut1`) and first contact has not happened (`flags.firstContact`);
- no sector has been captured.

Starting a new campaign therefore plays it once. Launching Landfall again, loading a save, using Return to a captured sector, or calling `startMission` directly never plays it.

**Skip.** The Skip button (mouse or touch), Esc or Enter skip at any moment. Space is the game's pause key, so it does not skip unless the player has tabbed onto the Skip button. The intro fades out over 0.45 s and then runs the same hand-off as the natural end, exactly once: a second press during the fade does nothing. The hand-off:

- marks the intro as seen and saves the campaign;
- puts the camera where a normal launch puts it;
- unpauses the game;
- starts the story, which is the Root-Link opening and then the tutorial.

While the intro plays, the game's keys (C, T, Space, the build keys) do nothing.

**Replay intro.** This button is on the planet screen, beside Saves. It plays the whole intro and then returns to the planet screen. Skipping returns there too. It never changes the campaign: captures, stock, evolutions and flags are compared before and after in the tests. It is only offered where no mission is running, and `introStart('replay')` refuses if a game is in progress.

## Save compatibility

- **Campaigns from before v48** have no `flags.v48`, so the intro never auto-plays for them. The player can still watch it with Replay intro.
- **Mission saves** (slots and save files) do not change. The intro creates no state inside `G`, apart from a held flag that is cleared at the hand-off before anything can be saved. Loading a save mid-Landfall keeps its tutorial step and does not play the intro.
- **The only new saved state** is two campaign flags: `v48:1` (this campaign began with the intro available) and `intro:1` (it has been seen). `campToJSON` already writes `flags`, and no older code reads these two, so they do not get in the way of anything else.

## Architecture

The intro lives in one module, `intro48.js`, which is inlined into `index.html` by `x48patch.py`. Every frame is a pure function of the clock `t` (seconds). Any moment can be drawn with `introSeek(t)`, and the same moment always draws the same picture: all randomness is seeded with `hash()`.

- **Held mission.** On first play, `introStart('first')` calls `startMission('landfall', true)`. The new `held` argument returns before `storyBegin`. The game is paused (`setSpeed(0)`) and `G.introHold` is set. The real map, terrain canvas, Bloom and Rootweb already exist, so the meadow and the Bloom in the intro are the real ones. Game time stays at 0 and the first wave timer stays at 150 until the hand-off. Replay builds the same mission in the same held state and throws it away afterwards (`G=null`).
- **Overlay.** `#intro` is a full-screen layer at z-index 40, holding its own canvas, letterbox bars, title, radio and caption lines, and the Skip button. `body.intro-on` hides the HUD, message feed and tutorial panel. While the overlay is opaque (`t < 51.6`), the main loop skips the game's own `render()`, which saves the cost of drawing a hidden frame. In scene 5 the overlay cuts a soft hole in its own ground (`destination-out`), and the real game render shows through it. The overlay sets the real camera from a close-up of the Bloom to the normal start position, so the end of the intro is the game's first frame, not a copy of it.
- **Clock.** `requestAnimationFrame` advances `t` by real time, limited to 0.1 s per frame. The clock pauses while the page is hidden, so the intro never jumps or skips captions after the player switches tabs.
- **Scenes.** `introOrbit`, `introMeadow`, `introUnder` (which includes `introCluster`) and `introSurface` overlap by 1–2 seconds so each one cross-fades into the next. `introText` switches the caption elements on and off from `INTRO_LINES`.
- **Prepared once.** `introPrep` builds, all seeded:
  - the stars;
  - the planet texture (the campaign globe's own);
  - the cloud canvas;
  - the soil cross-section (1400×1500);
  - the sacs, strands and branching tendrils.
- **Quality.** On the Low graphics setting the intro:
  - draws at 1× pixel density instead of up to 1.5×;
  - renders the planet at 180 px instead of 300 px;
  - builds the soil at half resolution, with fewer specks, stones and dead roots;
  - uses fewer dust puffs behind the truck and fewer falling grit and dust motes.

  The look is otherwise the same. All quality levels share the same timing and words.
- **Sound.** `INTRO_CUES` lists the timed sounds. One-shots go to the Effects bus. Looped beds go to the Ambience bus with smooth fades. Master, Effects, Ambience and Mute therefore all apply.
  - While the intro is on, the game's own ambience manager stands aside.
  - The intro's sounds decode first, so the opening hum is heard even while the other 164 sounds are still loading. A cue whose sound has not decoded yet waits up to 4 seconds and is then dropped.
  - The audio context is unlocked by the Launch click, so there are no autoplay errors. If sound is unavailable, the intro plays silently.
- **Keys.** `keydown` sends everything to `introKey` while the intro is on, before the dialogue or game handlers.

## Assets

No image or video files were added. The pictures are drawn from:

- the existing Landfall terrain canvas;
- the campaign globe's texture;
- the survey-truck prop (`PROP_DRAW.truck`);
- the game's own Bloom and Rootweb renderer;
- procedural soil, stars, clouds, sacs and tendrils.

Seven new recipes (ten sounds, counting variations) were added to `audio/sounds.js`. Their recipes are in `audio/source/sounds.js` and are rendered like the rest. The game now has 174 sounds (4.55 MB).

| Sound | Length | What it is |
|---|---|---|
| `intro_orbit` | 16 s loop | Low orbital hum with a slow, faint hiss |
| `intro_static` (2) | 1.4 s | Radio static burst |
| `intro_under` | 16 s loop | Deep, damp underground bed |
| `intro_drill` | 6.5 s | A distant low industrial resonance travelling through rock |
| `intro_pulse` (2) | 1.8 s | A soft, wet tissue pulse |
| `intro_soil` (2) | 3.2 s | Soil and grit settling |
| `intro_bloom` | 4.5 s | The Bloom opening: a slow organic swell |

The intro also reuses `amb_meadow`, `eng_scout`, `comm_radio` and `web_creep`. There is no percussion and no stinger. The tonal check measures 10–12 dB peaks, the same range as the v47 sounds.

## Results

All of these ran in this build (headless Chromium, and the packaged Windows app under Electron for the `elcheck` tests).

**`tests/xtest48.js`: 48 of 48 pass.**

- **First play in real time.** The intro starts on Launch with the mission held: game time 0, the first wave timer at 150, no dialogue, the interface hidden, and C, T and Space ignored. Every title, radio line and instinct appears, in order. At the end, the Root-Link opening plays once (`l_intro`, one `storyBegin`) and the camera matches a normal launch exactly. The campaign gains `intro:1`. After the dialogue, the tutorial opens on Step 1 with its ten steps. Launching Landfall again goes straight to the mission. Median frame time is 16.7 ms, which is the display rate.
- **Skip.** The test skipped at 2, 12, 25, 31, 40, 50, 55, 59.5 and 60.8 s, covering all six scenes and the fade. It used Esc, Enter, the button, Tab then Space, and a double press. Every time, Landfall started once, at game time 0, with the normal camera, and no intro sound was left playing.
- **Older campaigns and saves.**
  - A campaign without `flags.v48` launches straight into the mission.
  - A save made on tutorial Step 4 loads on Step 4 with no intro.
- **Replay intro.**
  - It plays from the planet screen and returns there at the end or on Skip.
  - The campaign is unchanged: captures, research, stock and flags are the same before and after.
  - It is refused while a mission is running.
- **Sound.**
  - The meter reads 0.108 RMS while the intro plays and exactly 0 when muted.
  - The game's own ambience is silent while the intro bed plays.
  - No intro sound is left after the hand-off.
- **Layout.** At 1920×1080, 1280×720, 390×844 and 844×390, every caption and the Skip button stay on screen, Skip never covers the radio, and there is no sideways scroll.
- **Determinism and cost.** The same moment draws the same pixels each time. Draw cost per frame, in ms:

  | Quality | Orbit | Meadow | Under | Waking | Surface |
  |---|---|---|---|---|---|
  | High | 6.1 | 0.1 | 0.8 | 0.4 | 0.3 |
  | Low | 2.4 | 0.1 | 0.3 | 0.3 | 0.1 |

  The game's own render is skipped while the intro is opaque.
- **Words.** There is no species name, "alien", "creature", "organism" or "hive" in any line, and every instinct is a single word with no "I".

**`tests/elcheck48.js`: passes.** In the Windows app, loaded from `file://` with no network, a new campaign plays the intro and its ten sounds decode and play through the mixer. Esc hands over to the Root-Link opening once, at game time 0. Replay intro leaves the campaign unchanged.

**Full regression (`runreg48.sh`, 52 runs).** Every test has the same or a better exit status than the v47 run, and three that failed in v47's run passed this time (`lcspit`, `xtest43`, `xtest46`).

- **Simulation identical.** `ident42`, run against v47 (`ident_v47`: 7 of 7, and the Bulwark variant: 4 of 4), shows that mission set-up, waves, combat and saves are identical to v47. The v44, v45 and v46 identity runs also all pass.
- **`lcstory` and `xtest46`.** Both start a brand-new campaign from the Launch button, so they now press Esc to skip the intro. That is the only test change.

**Known flaky tests (not caused by v48):**

- **`wbtest` check 05 (ore window edge).** Its measurement depends on a map layout that is not fully seeded: the ore patch it measures moves between runs, and so does the value. Across repeated runs it failed 1 of 12 times on v47 (a border jump of 6.82 against a limit of 6) and 5 of 10 times on v48 (values from 3.9 to 7.0). Diffing the two builds shows that v48 changes no drawing code outside the intro: besides the intro's own layer, styles and module, the changes are the Launch handler, `startMission`'s held argument, the `freshCamp` flag, the sound loading order, and guards in the key handler, render loop and ambience that do nothing while the intro is off. The higher rate is therefore most likely chance in a small sample, but this has not been proven.
- **`lcspit`.** Flaky on v46 and v47, as noted in the v47 doc. It passed in this run.
- **Older version suites.** Several checks in the `xtest37` to `xtest45` and `ident37` to `ident42` suites fail by the same counts in v47's run. They compare against builds whose behaviour has changed on purpose since then.
