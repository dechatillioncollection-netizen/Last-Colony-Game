# v47: the Landfall tutorial and combat audio

Two parts in one update: the Landfall tutorial rewritten and repaired, and the combat sounds rebuilt so they no longer ring like a xylophone or drip like water. No stats, weapons, story events, HDF visuals or volume settings changed.

## Gameplay changes to note

Only the tutorial's step checks changed how the game plays. Everything else is copy, sound or help.

- **Step 8 (Vine):** copper must reach the Bloom along a Vine. Before, any rise in the Bloom's copper counted, including a Root Tap touching the Bloom.
- **Step 9 (Node):** the Rootweb Node must be able to add at least 6 new tiles of Rootweb. Before, any Node counted, even one deep inside covered ground. A site counts as soon as it is placed, so nobody waits for it to grow.
- **Step 10 (Thorn Spitter):** the Spitter must be fully grown and fed copper by a Vine (or another route) before first contact begins. Before, a dry, unarmed Spitter started the patrol.
- **Step 5 (Swarm):** the step checks the real states, Attack and then Defend. Before, it counted two presses of the button.
- **Placement during the tutorial:** the game records which hive growth received copper from a route. This is tutorial-only data in `G.story` (`vcore`, `vtur`, `tap`, `nodeAt`, `nodeOk`). It is not read anywhere else, and saves outside the tutorial are byte-identical to v46 (see Results).
- **Mission tip:** the Landfall tip (the Bloom's 11-tile reach) is now shown after the tutorial and after Skip. Before, it was never shown in game.

## Tutorial: before and after

Each panel now has one bright action line, at most one or two muted lines of explanation, and an amber hint line that only appears when something needs fixing. The Controls list is folded away under the panel.

| Step | Before: message | Before: trigger | After: message (action, then explanation) | After: trigger |
|---|---|---|---|---|
| Welcome | none (the panel opened on Step 1) | none | "Welcome to Landfall. Learn to move, grow and defend the hive. Enemy waves are paused until the tutorial ends." (lead line on Step 1) | none |
| 1 Look around | "Drag the ground with the middle mouse button (one finger on touch), use WASD or the arrow keys, or tap the minimap. Scroll **or pinch** to zoom. Press H to jump back to the Bloom." | camera moved 5 tiles or zoom changed 18% | "Move the camera with WASD or by dragging with the middle mouse button. Scroll to zoom." Then: "Press H at any time to return to the Bloom." Touch: "Drag with one finger to move the camera, or tap the minimap." | unchanged |
| 2 Select the Bloom | "Click or tap the Bloom, the great flower at the heart of your Rootweb. Selecting any growth shows what it is doing in the panel at the bottom." | Bloom selected | "Select the Bloom, the large flower at the centre of the colony." Then: "Its details appear in the information panel at the bottom." | unchanged |
| 3 Select a Mite Ant | "The Bloom has budded three Mite Ants. Click or tap one to select it, or drag a box over several with the left mouse button. Its health and orders show in the panel." | an ant selected | "Three Mite Ants have emerged near the Bloom. Select one of them." Then: "Its health and orders appear in the panel. With no growth chosen, you can also drag a box to select several ants." (no box hint on touch) | unchanged; the three ants are still budded once |
| 4 Move your ant | "With the ant selected, click or tap open ground to send it there. It will hold that spot and fight anything that comes close." | any ant holding a spot | "With an ant selected, click clear ground to move it there." ("tap" on touch) Then: "It will hold that position and defend itself if threatened." Hint: "First select an ant." | unchanged (a click on rock still gives no order) |
| 5 Swarm | "The Swarm button (or C) switches every ant between Defend and Attack. Switching clears move orders. Press it twice to bring your ants home." | two presses, whatever the state | "Press Swarm (C) twice: once to switch to Attack, then back to Defend." Then: "Defend gathers your ants near the Bloom. Attack sends them towards enemies. Switching also cancels individual move orders." Hint after one press: "Now switch back to Defend." | two switches **and** the Swarm is on Defend |
| 6 The Rootweb | "The purple ground is Rootweb. Every growth has to stand on it, although vines can reach past it. The Bloom spreads it by itself, but here only a short way around it: the dashed ring shows how far while you place a growth. Rootweb Nodes push it further. Ore lies in the ground as coloured crystals: copper is orange." | Next | "The purple ground is Rootweb. Most growths must be placed on it, but Root Taps and Deep Roots can go on ore beyond it. Vines can reach up to five connected tiles past its edge." The ring moved to Step 9 and the ore colour to Step 7. | Next (the only Next step) |
| 7 Root Tap | "Open the Roots tab and pick the Root Tap (or press 4), then place it on copper ore. More ore under it means faster gathering. Every growth costs items from the Bloom, shown at the top left." | any Root Tap on copper, even touching the Bloom | "Open Roots and choose Root Tap (4). Place it over the highlighted copper ore." Then: "Copper shows as pale orange crystals. More ore under the Root Tap means faster mining. A new growth takes a little while to grow." Hints: a Tap touching the Bloom ("needs no Vine. Place one a little further out"), a Tap on the wrong ore ("That Root Tap is on lead…") | a Root Tap site on copper that does **not** touch the Bloom |
| 8 Vine | "Pick the Vine (1) from the Vines tab and drag from the Root Tap to the Bloom. Vines carry items the way they grow, and turn corners as you drag. R rotates a single piece." | the Bloom's copper rose for any reason | "Choose Vine (1) in the Vines tab. Drag from the Root Tap to the Bloom so copper flows home." Then: "Check the arrows in the preview: copper travels the way they point." Hints in turn: Tap still growing; start beside the Tap; Vine still growing; **Vine points into the Tap** ("Check the arrows: remove it and lay it again"); copper backing up ("Check that the Vine's arrows point towards the Bloom"); the Ctrl and R tip while the Vine tool is chosen | copper delivered into the Bloom **by a Vine** |
| 9 Node | "Open the Rootweb tab and plant a Rootweb Node near the edge of the purple ground. Each node grows new Rootweb around itself, which is how the swarm expands." | any Node | "Open Rootweb and choose Rootweb Node. Place it near the edge of the purple ground, by the ring." Then: "The Bloom spreads Rootweb only about 11 tiles here. Choose a growth to see that reach as a dashed ring. Rootweb grows around exposed ore rather than covering it." A ring marks a spot that adds the most new ground. Hints: Node deep inside; not enough copper | a Node (site or grown) that adds 6 or more new Rootweb tiles |
| 10 Thorn Spitter | "Open the Spitters tab and grow a Thorn Spitter (5) on the eastern side of the Bloom. Spitters fire copper fed to them by vine." | any grown Spitter, dry or not | "Open Spitters and choose Thorn Spitter (5). Place it east of the Bloom, near the ring. Let it finish growing, then feed it copper through a Vine." Then: "Spitters fire what Vines bring them. Copper is the first ammunition; resin and chitin hit harder later." Hints: not enough copper; growing; "Now feed it copper: run a Vine from a Root Tap…" | a grown Spitter that has received copper from a Vine |
| After Step 10 | "Something is moving along the survey track to the east." | | "Your defences are ready. Movement has been detected on the survey track to the east." Then the existing first contact, unchanged. | |
| Completion lines | "Look around: done." and so on | | Something useful: "Camera moved. H brings you back to the Bloom.", "The panel shows what any selected growth is doing.", "Ant selected.", "Order given. The ant holds that spot.", "Your Swarm is back on Defend.", "Root Tap placed. It starts mining once it has grown.", "Copper is flowing into the Bloom.", "The Node will spread new Rootweb once it has grown." | |
| Replay offer | "Replay it, or skip straight to the mission. The first contact with the humans has already happened, so it will not repeat." (wrong: a replay does play it) | | "Replay the tutorial, including the first meeting with the humans, or skip it and start defending straight away." Buttons: Replay tutorial, Skip to the mission | |
| Skip | "Survive 10 waves. Feed your Thorn Spitters copper by vine." | | "Survive 10 waves. Keep your Thorn Spitters fed with copper by Vine." and the mission tip | |
| End | "Tutorial complete. … keep your Thorn Spitters fed with copper." | | "… keep your Thorn Spitters fed by Vine." and the mission tip | |

On a touch screen (coarse pointer and no fine pointer) the panels name only touch controls: no keys, no mouse, no pinch.

### Placement messages

| Before | After |
|---|---|
| Needs Rootweb under it. Plant Rootweb Nodes to spread it | This growth must be placed on Rootweb. Plant Rootweb Nodes to spread it (only Root Taps and Deep Roots can go on ore beyond it) |
| No ore under it | No ore here. Place it over exposed ore crystals |
| Vines past the Rootweb must join it, or join a vine that does | A Vine beyond the Rootweb must connect to it, directly or through other Vines |
| Too far from Rootweb: vines reach 5 tiles past it (this would be tile 6) | Too far from Rootweb: Vines can extend 5 connected tiles beyond it (this would be tile 6) |

Timed growth is explained where it matters: the Root Tap step says a new growth takes a while, the completion lines say "once it has grown", and the hints say when a Tap, Vine or Spitter is still growing.

### Controls help

A folded Controls list sits under the tutorial panel and in Settings. It covers WASD, the arrows, middle-drag and touch drag; the wheel and H; left-click and box select; Ctrl-drag; R, Shift+R and the wheel; Esc; right-click, X and Delete; Alt; Q; the number keys; C; T; Space; and the speed buttons.

## Combat audio

### Why it rang

- **v46 hull hits, chitin hits and gun breech clacks** were built from a few long, clean sine modes, so every hit was a note. The variations had different pitches, which is where the xylophone came from.
- **Hive shots and hits** had bubble resonances, falling-pitch sines that sound like a drop of water.
- **The Sunlance** carried pure tones.

### What replaced it

Every shot and impact is now built from noise:

- a sharp high-passed transient;
- a short noise body through broad bands;
- a low thud whose pitch falls too fast to hear as a note;
- debris or rattle.

Where metal must ring, it rings as a dense cluster of 70 to 90 short inharmonic modes. That reads as metal without having a pitch.

**Pitch measurement.** This is the strongest narrow spectral peak after the attack, in dB above the level around it. Plain noise scores about 10 to 12. `aud/tonalcheck.js` fails any combat sound over 22 dB:

- v46: 25 of 64 combat sound files fail, the worst being the Sunlance at 54.5 dB.
- v47: 0 of 83 fail, the worst being a vehicle hull hit at 21.6 dB.

| Weapon | Layers in v47 | Peak, v46 → v47 (dB) |
|---|---|---|
| Thorn Spitter | muscular snap, pressurised discharge, thorn hiss | 16.8 → 11.7 |
| Spore Flak | sac clench, clustered discharge, spore burst (no bubble pops) | 11.6 → 11.4 |
| Seed Mortar launch | tissue clench, deep fibrous pod launch | 13.8 → 13.2 |
| Seed Mortar burst | husk crack, fibrous rupture, soil and fragments | 15.3 → 13.1 |
| Sunlance | rising, fluttering focus surge, then a concentrated searing burst | 54.2 → 11.2 |
| Mite Ant | small gland tick and hiss | 16.0 → 13.1 |
| Thornback Ant | hard flick, thorn snapping loose | 18.8 → 14.6 |
| Bulwark Ant | heavy muscular heave, thick sap rush | 11.5 → 11.8 |
| Scout Tank gun | muzzle crack, blast, low punch, breech clack as noise | 31.9 → 16.0 |
| Duo turret | as the gun, lighter | 35.9 → 14.0 |
| Interceptor cannon | short ripping burst | 18.5 → 11.2 |
| Siege Tank and Mortar | forceful crack, deep blast, recoil shove, long tail | 22.8 → 17.6 |
| Flak turret | gun pieces (shared breech change) | 26.9 → 15.9 |
| Flame Tank | valve hiss, ignition whump, ragged roaring jet | 11.3 → 10.4 |
| Shell or bomb | crack, deep boom, soil and stone falling back | 13.4 → 14.1 |

| Target, and the sound it plays | Layers | Peak (dB) |
|---|---|---|
| Soft growths, the Bloom, Petal Gate (`org_hit`; the Bloom and big hits play it lower) | wet dull thud, fibrous tear, sap spatter | 11.1 → 10.4 |
| Bark Wall (`imp_bark`) | woody cellulose crack | 9 to 11 (new) |
| Great Bark and Maw Gate (`imp_bark_heavy`) | denser crack with more resistance | 10 to 11 (new) |
| Ironbark (`imp_ironbark`) | hard, sharp crack, shrugged off | 10 to 11 (new) |
| Mite and Thornback Ants (`ant_hit`) | dry chitin crunch | 32.0 → 10.9 |
| Bulwark Ant (`imp_bark`, higher) | its bark plates | new mapping |
| HDF vehicles (`metal_hit`; higher on flyers) | hard metallic strike, dull hull body, brief rattle | 49.5 → 18.1 |
| Siege Tank or any hit of 16+ damage (`metal_heavy`) | crunching strike, deep structural body, rattling parts | 50.7 → 15.2 |
| HDF buildings (`imp_struct`; `metal_heavy` for big ones or big hits) | structural clang and concrete crunch | 13 to 21 (new) |
| Rock (`imp_rock`): enemy rounds that stop on rock, shells landing on rock | sharp crack, stone chips | 12 to 13 (new) |
| Ground (`imp_ground`): shells landing on open soil | dull thump and grit | 9 to 10 (new) |
| Flame and Sunlance on anything (`imp_burn`) | searing hiss, scorching crackle | 11 to 12 (new) |
| Destroyed growth, ant, vehicle, building | wet rupture; shell crunch; blast and metal crash; groaning collapse | 11.3 → 11.5, 13.7 → 11.7, 21.0 → 14.1, 28.1 → 14.0 |

**How the material is chosen.** It comes from the target's type, never from its colour:

- `SND_MAT` maps the hive's wall types.
- Unit and enemy types pick the ant and vehicle sounds.
- A weapon tag (`SNDW`) is set only while a flame jet or a beam deals its damage, so those hits scorch.

**No imaginary hits.** There is no impact sound for any of these:

- a shot that runs out;
- a beam that crosses empty ground;
- a hit on something already destroyed.

**The mix.**

- A limiter after the main compressor keeps the output at or below full scale.
- When more than 6 voices play, sounds below priority 4 lose 5% of their gain per extra voice.
- The voice cap (24) and the per-sound caps and cooldowns from v46 still apply.
- A nearby big explosion stays above distant small hits, because distance attenuation and the priority order are unchanged.

The sliders (Master, Sound Effects, Ambience), Mute, the browser's first-click unlock and the offline Windows app all work as in v46.

### Listening

- **Settings > Audio > Sound test** has 32 buttons for every weapon, impact and destruction sound. Each click plays the next variation.
- It also has 13 shot-and-impact pairs with the flight time between them, and a crowd button that plays forty sounds in two seconds.
- `combat-before-v46.mp3` and `combat-after-v47.mp3` play the same 22 sounds in the same order. `material-impacts-v47.mp3` plays the 7 new impacts. The order is in `order.txt`.

## Results

All of these ran on the final build.

**New tests.**

- `tests/xtest47.js`: 50 of 50 pass.
- `tests/elcheck47.js`, the Windows app under Electron 33 from `file://`: passes. It covers 164 sounds decoded offline, material impacts in a fight with the peak at 0.52, the new tutorial panel, all 32 sound-test buttons and the settings being kept.
- `audio/source/tonalcheck.js`: 83 of 83 combat sound files pass. The same check on v46 fails 25 of 64.

**Saves are unchanged.** `ident42.js` was run with v46 as the old build, at medium and epic quality, art on and off, and with a Bulwark brood. Every save is byte-identical to v46 (7 of 7 and 4 of 4). The tutorial-only fields are not written outside the tutorial.

**Mix.**

- 110 combatants at full volume: the peak stays at or below 0.94 after the limiter.
- The voice count tops out at the cap of 24.
- The sound code costs 0.016 ms per step on the game thread, about 0.65 ms per step overall.
- `xtest46` (v46 sound and camera, 35 checks) passes on v47.

**Full regression.** About 50 suites ran in sequence (`runreg47.sh`, logs in `reg47/`). Compared with the v46 run of the same suites:

- **Same as v46.** These failures are identical, line for line, to v46. They are old identity checks against v37–v42 builds that later versions intentionally changed, the art fallback checks that expect a missing file, and the GPU-path timing that headless Chromium cannot measure: `xtest37`, `xtest38`, `xtest40`, `xtest41`, `xtest42`, `ident37`–`ident42`, `lcart`, `lcbloom`, `wbtest`, `otest`, `vtest`, `xtest44`, `xtest45`.
- **Legitimate test changes for v47.**
  - `xtest43` checked the old Vine-reach message text with `/must join/`; it now accepts the new wording and passes 71 of 71.
  - `lcstory` now feeds the Thorn Spitter by Vine and plants the Node on the ringed spot, because those steps now require it.
  - `ncheck` reads the new panel fields.
- **Under load.** `xtest46`'s frame comparison failed during the full run (33.3 ms medians while other suites loaded the machine; v46 failed the same check in its own run). Run on its own it passes 35 of 35.
- **Known flaky.** `lcspit` fails intermittently with "Cannot read 'ammo'" on some random maps. In 4 runs each it failed 1 time on v47 and 2 times on v46.
