# v50: the desktop app, ready for Steam and itch.io

The game now builds as a desktop app for Windows, Linux (including Steam Deck) and macOS. Each build is a plain folder, which is what Steam and itch.io upload. The web version is unchanged.

Screenshots are in `docs/screenshots/v50-desktop/`.

## What the desktop app adds

- **Ultra quality.** A fifth preset, shown only in the app. It is everything in Epic, drawn at up to twice the screen's resolution (supersampled), with denser drifting dust. It never draws more than about 12.5 million pixels, so a 4K screen gets less than twice.
- **Steady frame rate.** A guard that is on by default and can be turned off in Settings.
  - It aims for 60 frames a second, or the screen's own rate if that is slower (for example a 50 Hz television).
  - When frames run late it lowers the drawing resolution by 15% a second. It never goes below 75% of the screen's resolution.
  - It raises the resolution again by 12% at a time, at most every 3 seconds. It only does so when frames are on time and each frame's own work is under half the frame time.
  - If a step up has to be undone within 3 seconds, it waits twice as long before trying again, up to a minute. This stops it from flickering between two sizes.
  - It changes nothing else about the picture or the game.
  - F3 shows the frame rate and the resolution in use.
- **Saves as files.**
  - Each save is a JSON file in the app's data folder, under `saves/`. It is written to a temporary file and then renamed, so a crash never leaves half a save.
  - The first time a save is needed, the app brings over anything an older version kept in its browser storage.
  - Steam Cloud can carry these files (see below).
- **Full screen.** The app opens full screen the first time. F11, Alt+Enter or the switch in Settings change it. The app remembers the choice and the window size.
- **Quit.** A Quit button on the main menu.
- **Steam.** The overlay (Shift+Tab) and six achievements: one for each sector captured, and one for all of them. Without Steam (itch.io, direct download, or Steam not running), these do nothing and the game runs as normal.
- **Safety.** The page only sees a small `lcDesktop` bridge (saves, quit, full screen, achievements). It has no Node access. Save names are checked, so the game can never write outside the saves folder.
- **Icon.** Made from the Bloom (`electron/icons/`), as `.png`, `.ico` and `.icns`.

## Building

You need Node 18 or later.

```
cd electron
./build.sh              # all of them
./build.sh win linux    # only some
```

Output in `electron/out/`:

| Folder | Zip | Size (zipped) |
|---|---|---|
| `Last Colony-win32-x64/` | `LastColony-Windows.zip` | about 130 MB |
| `Last Colony-linux-x64/` | `LastColony-Linux.zip` | about 120 MB |
| `Last Colony-darwin-x64/` | `LastColony-macOS-Intel.zip` | about 120 MB |
| `Last Colony-darwin-arm64/` | `LastColony-macOS-AppleSilicon.zip` | about 115 MB |

Most of the size is the Electron runtime, which bundles Chromium. The game itself, with its art, sound and the Steam library, is about 20 MB.

### macOS

The Mac builds are not signed. A downloaded copy will be blocked by Gatekeeper until it is signed and notarised. That needs:

- an Apple Developer account (US$99 a year);
- a Mac to run `codesign` and `notarytool` on.

Steam's Mac depot uses the Intel build. It runs on every Mac, and on Apple silicon through Rosetta.

## Putting it on Steam

1. **Join Steamworks.** Sign up at partner.steamgames.com. You will need to give bank and tax details and pay the Steam Direct fee: US$100 per game, paid back after the game earns US$1,000.
2. **Create the app.** Steamworks gives you an App ID. Under SteamPipe, then Depots, make three depots: Windows, Linux and macOS.
3. **Edit `electron/steam/app_build.vdf`.** Replace `1000000` with the App ID and `1000001`, `1000002` and `1000003` with the depot IDs.
4. **Set the launch options** (Installation, then General):

   | OS | Executable |
   |---|---|
   | Windows | `Last Colony.exe` |
   | Linux | `Last Colony` |
   | macOS | `Last Colony.app` |

5. **Set up Steam Cloud** (Steam Cloud, then Auto-Cloud). Give it 10 MB and 100 files. Add one root path per OS, each with the subdirectory `Last Colony/saves`, pattern `*.json`, and recursive off:

   | OS | Root |
   |---|---|
   | Windows | `WinAppDataRoaming` |
   | Linux | `LinuxXdgConfigHome` |
   | macOS | `MacAppSupport` |

6. **Add the achievements** from `electron/steam/achievements.csv` (Stats and Achievements). The API names must match exactly. Each needs a 256×256 icon in two versions, locked and unlocked.
7. **Upload.** Build first, install SteamCMD, then run:

   ```
   cd electron/steam
   STEAM_USER=your_build_account ./upload.sh
   ```

   The build appears under SteamPipe, then Builds. Set it live on a branch, testing on a beta branch first.
8. **Store page and review.** Steam needs a store page with capsule images, screenshots and a trailer. Check the current image sizes in Steamworks under Store Page Admin, then Graphical Assets. Steam reviews the store page and the build. The page must be public as "Coming Soon" for at least two weeks before release.

For testing before you have an App ID, put a file called `steam_appid.txt` containing `480` (Valve's test app, Spacewar) next to the executable. Steam must be running. Remove the file before uploading.

## Putting it on itch.io

1. Create the game page on itch.io and choose "Downloadable".
2. Install butler, itch.io's upload tool, and run `butler login`.
3. Build, then run:

   ```
   cd electron/itch
   ITCH_GAME=yourname/last-colony ./push.sh --userversion 0.5.0
   ```

   This uploads Windows, Linux, Mac (Intel) and Mac (Apple silicon) as four channels. The itch.io app picks the right one for each player.

Other stores (GOG, Epic, Microsoft Store) also take the same folders. Each has its own sign-up and upload tool.

## Results

These were run on the builds in `electron/out/`.

**`tests/elcheck50.js` on the packaged Linux app under a virtual display: 21 of 21 pass.** It covers:

- the bridge, and that the page has no Node access;
- saves written as files and older browser saves brought over;
- no temporary files left behind, and save names kept inside the saves folder;
- achievements doing nothing quietly without Steam;
- the Settings options;
- Ultra at 3840×2160 on a 1920×1080 screen;
- the guard lowering the resolution under load, and, with set frame times, climbing back, dropping quickly and backing off;
- the F3 readout, and switching the guard off;
- a capture;
- Quit, and the window mode and saves kept for the next run;
- the intro playing in the app.

**The web version is unchanged.**

- In a browser, the page has no `lcDesktop` bridge, Ultra and Quit stay hidden, and saves stay in browser storage.
- `tests/xtest49.js`: 60 of 60 pass.
- Gameplay matches v49 exactly (`ident42.js` against v49: all pass, including the Bulwark variant).

**`tests/elcheck48.js` on the Windows build's files: passes.**

**Not tested here:**

- the Windows and Mac builds running on their own systems. They hold the same code as the Linux build, but this machine cannot run them;
- Steam itself (the overlay, achievements unlocking, Steam Cloud) and a Steam Deck. These need a Steam account with an App ID;
- frame rates on real graphics cards. This machine has none, so it draws everything on the processor, and the numbers it gives mean nothing for real hardware. Under that load the guard went down to 75% and stayed there, which is the intended floor.
