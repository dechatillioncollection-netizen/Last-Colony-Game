# v51: timed hatching, rally points, the pause menu, the updater and the installer

Screenshots are in `docs/screenshots/v51/`.

## Hatching takes time

Before v51, a pod or chamber kept its items until the ant was finished, and the ant appeared as soon as its progress filled. Now each ant grows from an egg:

1. As soon as a Spawning Pod or Brood Chamber holds the items for one ant, it lays the egg and takes those items.
2. The ant hatches after its hatch time. A Brood Chamber short of vigor grows its egg more slowly, as before.

   | Ant | Before | Now |
   |---|---|---|
   | Mite Ant | 6 s | 10 s |
   | Thornback Ant | 10 s | 15 s |
   | Bulwark Ant | 20 s | 30 s |

3. Items that arrive while the egg grows wait for the next egg. A pod still holds up to two ants' worth.
4. At the swarm limit no egg is laid, so no items are taken. An egg that is ready waits until there is room, then hatches.
5. Switching what a chamber hatches gives back the items of the egg it was growing. Clicking the kind that is already chosen now does nothing (before, it emptied the pod).

**Where you see it:**
- A bar under the pod shows how far the egg has grown. It is green while growing and amber when the egg is ready and waiting for room.
- The panel shows the egg, how far it has grown and the seconds left. It also shows what the next egg still needs, and the hatch time.
- The Brood Chamber's painted embryo already followed the progress, so it now grows over the longer time.

**Saves:**
- The egg (`egg`) and rally point (`rally`) are saved with the pod.
- A save from before v51 that was part-way through a hatch still has the items in the pod. The pod takes them as an egg and carries on from where it was.

The hatch times are three numbers in `U` (`time:`), so they are easy to tune.

## Rally points

- **Setting one:** select a Spawning Pod or Brood Chamber, then click or tap open ground. Every ant it hatches from then on walks to that spot. The pod stays selected and the message says "new ants will walk here".
- **Where the ants stand:** side by side round the spot, never on one point. Each new ant takes the nearest free place in rings out from it.
- **Seeing it:** a dashed line and a small flag show the spot while the pod is selected.
- **Clearing it:** Clear rally point, in the pod's panel. New ants then wait by the Bloom as before.
- **Other clicks are unchanged:**
  - With ants selected, a click on open ground still sends the ants.
  - A click on a building selects it.
  - Esc clears the selection.
- **Orders:** an ant at a rally point holds there like an ant you sent. It still fights anything in range. The Swarm button clears every ant's move order, as before.

## The pause menu

- **Opening it:** press Esc in a match, or the new Menu button in the top bar. Esc first cancels a drag, then puts down a chosen growth, then clears a selection. Only with none of those does it open the menu.
- **What it does:** the game pauses (the speed you had is restored when you resume). The menu offers:
  - **Resume.**
  - **Settings.**
  - **Save or load:** the existing save screen.
  - **Main menu.**
  - **Quit game:** desktop app only.
- **Leaving the match:** Main menu and Quit save the game to the autosave slot first. A captured sector saves its own sector save.
- **Esc in the menus:**
  - Esc closes Settings or the save screen and returns to the menu.
  - Esc in the menu resumes.
  - Esc also closes Settings when it was opened from the top bar.

## The updater

`electron/updater/` is a small Go program, built by `electron/build.sh` into each Windows and Linux folder as `Updater.exe` (`updater` on Linux), with `updater.json` next to it:

```
{ "repo": "dechatillioncollection-netizen/Last-Colony-Game", "asset": "LastColony-Windows.zip" }
```

When a player runs it:

1. **Check.** It reads the installed version from `resources/app/package.json` and asks GitHub for the newest release. If the newest release's tag (for example `v0.6.0`) is not newer, it says so and stops.
2. **Download.** Otherwise it asks, then downloads that release's zip for this system, with a progress readout.
3. **Verify.** If GitHub lists the file's checksum, it checks it, and a damaged download changes nothing. It also refuses any zip entry that would land outside the game folder.
4. **Replace.** It unpacks into a temporary folder inside the game folder. Then it moves each old file or folder aside and the new one in. If any step fails, everything is put back.
5. **Clean up.** It keeps the local `updater.json`, removes the old copies, and offers to start the game.

**On Windows:** it first checks that the game is closed. A running program can't be renamed there, so it tries that.

**Saves are never touched.** They live in the user's data folder, not the game folder.

**Steam:** Steam leaves the updater out (`FileExclusion` in `steam/app_build.vdf`) because Steam updates the game itself. The itch.io app does the same, but the updater is harmless there.

**To publish an update for it:**

1. Bump `version` in `electron/package.json`.
2. Run `electron/build.sh`.
3. On GitHub, create a release whose tag is that version (for example `v0.6.0`) and attach the zips with their names unchanged.

**Where it looks.** The game is published in the public repository `dechatillioncollection-netizen/Last-Colony-Game`. That is where the updater looks and where releases go. The development repository stays private, because it held private story notes in its history. To use another repository, set `UPDATE_REPO=owner/name` when building, or edit `updater.json`. `GITHUB_TOKEN` works for testing against a private repository. Never put a token in a download.

## The installer

`LastColonySetup.exe` (and `LastColonySetup-Linux`) is the same program as the updater. `electron/build.sh` builds it into `electron/out/` next to the zips. What it does depends on where it runs:

- **With no game next to it,** it is the installer:
  1. It offers to install into its own folder. The player can press Enter, type another folder, or cancel. `--dir` sets the folder without asking.
  2. It downloads the newest release's zip, checks it and unpacks it into that folder. The folder can hold other files. If any of them has the same name as one of the game's, it stops and changes nothing.
  3. It writes the names of the game's own top-level files and folders to `.lastcolony-files`. Updates add any new ones, and only those are ever replaced or removed.
  4. It puts two copies of itself next to the game:
     - `Updater.exe` (`updater` on Linux);
     - `Uninstall Last Colony.exe` (`uninstall-last-colony`). A copy whose name contains "uninstall" uninstalls when run.

     So both work fully, even if the release's own updater is older.
  5. On Windows it adds to the Start menu: Last Colony, Update Last Colony and Uninstall Last Colony, plus Last Colony on the desktop. It also lists the game under Installed apps, with its version, size and an Uninstall button. On Linux it adds the same three entries to the applications menu.
  6. It offers to start the game.
- **With the game next to it** (the installer again, or `Updater.exe`), it updates. After an update it also sets the version shown under Installed apps.
- **To uninstall,** use `Uninstall Last Colony`, Installed apps, or `--uninstall` on either copy. After asking, it removes:
  - the shortcuts;
  - the Installed apps entry;
  - the game's own files.

  The player's other files in the folder stay, and so does the installer, and saves are kept. The folder itself goes only if that leaves it empty. On Windows a running program can't delete itself, so a hidden helper removes it once it has closed.
- **A folder unzipped by hand** has no `.lastcolony-files`. Uninstalling there removes the whole folder's contents, as it is the game's own folder.

**Where it looks.** The installer looks in `UPDATE_REPO` (set when building), and the copy in the game folder reads `updater.json` as before.

**To publish it,** attach `LastColonySetup.exe` to the GitHub release alongside the zips. Players then only need that one file.

**Not signed.** Windows SmartScreen will warn about an unsigned download ("Windows protected your PC", then More info, then Run anyway). Signing it needs a code-signing certificate.

## Results

- **`tests/xtest51.js`: 19 of 19 pass.** It covers:
  - the egg is laid at once and its items taken;
  - hatch times of exactly 10, 15 and 30 s;
  - two eggs in a row, 10 s apart;
  - half vigor taking twice as long;
  - the swarm limit;
  - switching what hatches;
  - with real clicks: setting a rally point, three ants walking there and standing apart, a click on a building, ants selected sending the ants, and clearing it;
  - a save round trip, and a pre-v51 save part-way through a hatch;
  - drawing at every quality;
  - the pause menu: Esc order, Settings and Save or load, the Menu button, and Main menu saving and leaving.
- **`tests/updtest.py` on the Linux build: 9 of 9 pass.** It runs against a stand-in GitHub server and covers:
  - `--check`;
  - a damaged download and an unsafe zip, both refused with nothing changed;
  - no releases;
  - an update that replaces the game, checks the checksum and leaves nothing behind;
  - the local `updater.json` kept, and files still executable;
  - "already the newest version" on a second run.
- **`tests/insttest.py` on `LastColonySetup-Linux`: 21 of 21 pass.** It runs against a stand-in GitHub server, from a Downloads folder that also holds a file of the player's. It covers:
  - n at the first question installing nothing, and a typed folder used instead;
  - an install into the installer's own folder that:
    - leaves the game ready to run, with the player's file and the installer kept and nothing behind;
    - adds itself as the updater and the uninstaller (replacing an older updater), `updater.json`, a list holding only the game's files, and three menu entries;
  - the installer run again becoming the updater: up to date, then updating to a newer version with the player's file kept;
  - a folder with a file the game would replace refused, and left as it was;
  - uninstalling:
    - the uninstaller asking first, then removing the game and its menu entries;
    - only the installer and the player's file left, and saves kept;
    - "not installed" when it isn't;
    - `--uninstall` on the updater removing a game folder that is then empty.
- **The installer against the real GitHub release:** on Linux it installed 0.6.0 from `Last-Colony-Game` into a folder next to another file, with the checksum checked. The uninstaller then removed it, leaving only the installer and that file.
- **`tests/elcheck50.js` on the Linux app: 22 of 22 pass.** This adds Esc in a match opening the pause menu, whose Quit saves and closes the app.
- **Not tested:**
  - `Updater.exe` and `LastColonySetup.exe` on Windows, because this machine cannot run them. They are the same code, built for Windows, and it compiles and passes `go vet` for Windows. Their Windows-only steps were not exercised: checking the game is closed, the shortcuts (made with PowerShell), the Installed apps entry (made with `reg`), and removing the folder after closing.

**Full regression (56 runs).** Every test has the same result as v49's run except those that hatch ants from a Brood Chamber on a timer, which now differ by design:

- **The `ident42.js` comparisons against v44 to v48.** These fight a wave with a Brood Chamber hatching, so the old and new runs differ. v51 with art off and on is still identical.
- **Three `xtest42.js` checks.** They count ants hatched in a fixed 40–50 s window, so fewer hatch in that time.

Everything without hatching is unchanged. That includes the tutorial (`lcstory`), saves, the intro (`xtest49`) and the older suites' known failures.

The local web server stopped part-way through the run. Every test from `ident37` on was run again with a fresh server, and these are the results shown.
