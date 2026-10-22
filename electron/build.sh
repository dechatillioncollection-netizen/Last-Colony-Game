#!/usr/bin/env bash
# Builds the desktop app as plain folders (what Steam and itch.io upload) and a zip of each.
#   ./build.sh                 Windows, Linux and macOS (Intel and Apple silicon)
#   ./build.sh win linux       only those
# Output: electron/out/Last Colony-<platform>-<arch>/ and electron/out/LastColony-<Platform>.zip,
# plus the installers electron/out/LastColonySetup.exe (Windows) and LastColonySetup-Linux
# Needs Node 18+ and npm. electron-packager and the Electron runtime are fetched on first use.
# steamworks.js (Steam overlay and achievements) is bundled; the game runs the same without Steam.
# The Windows and Linux folders also get the updater (Updater.exe / updater, built from updater/ with Go 1.22+) and updater.json,
# which say where it looks for new releases. Steam leaves these out (steam/app_build.vdf) because Steam updates the game itself.
UPDATE_REPO="${UPDATE_REPO:-dechatillioncollection-netizen/Last-Colony-Game}"
set -euo pipefail
cd "$(dirname "$0")"
ELECTRON=33.2.1
targets=("$@"); [ ${#targets[@]} -eq 0 ] && targets=(win linux mac)

rm -rf app && mkdir app
cp main.js preload.js package.json app/
cp icons/icon.png app/
cp ../index.html app/
cp -r ../art app/art && rm -rf app/art/source
mkdir -p app/audio && cp ../audio/sounds.js app/audio/
(cd app && npm install --omit=dev --no-audit --no-fund --no-package-lock >/dev/null)

mkdir -p out
pack() { # platform arch
  npx --yes @electron/packager@20.3.0 app "Last Colony" --platform="$1" --arch="$2" --electron-version=$ELECTRON \
    --icon=icons/icon --out=out --overwrite --no-asar --app-copyright="Last Colony" \
    --win32metadata.ProductName="Last Colony" --win32metadata.FileDescription="Last Colony" \
    --app-bundle-id=com.lastcolony.game --app-category-type=public.app-category.strategy-games >/dev/null
  local dir="out/Last Colony-$1-$2" sw
  sw="$dir/resources/app/node_modules/steamworks.js/dist"
  [ "$1" = darwin ] && sw="$dir/Last Colony.app/Contents/Resources/app/node_modules/steamworks.js/dist"
  # keep only this platform's Steam library
  case "$1" in
    win32) rm -rf "$sw/linux64" "$sw/osx" "$sw/win64/steam_api64.lib" ;;
    linux) rm -rf "$sw/win64" "$sw/osx" ;;
    darwin) rm -rf "$sw/win64" "$sw/linux64"; [ "$2" = x64 ] && rm -f "$sw/osx/steamworksjs.darwin-arm64.node"; [ "$2" = arm64 ] && rm -f "$sw/osx/steamworksjs.darwin-x64.node" ;;
  esac
  echo "built $dir"
}
updater() { # GOOS exe-name folder asset
  goexe "$1" "../out/$3/$2"
  printf '{\n  "repo": "%s",\n  "asset": "%s"\n}\n' "$UPDATE_REPO" "$4" > "out/$3/updater.json"
}
goexe() { # GOOS output
  (cd updater && CGO_ENABLED=0 GOOS="$1" GOARCH=amd64 go build -trimpath -ldflags="-s -w -X main.defaultRepo=$UPDATE_REPO" -o "$2" .)
}
# the installer is the same program; run on its own it installs the game, and the copy it leaves in the game folder updates it
setup() { # GOOS output-name
  goexe "$1" "../out/$2" && echo "built out/$2"
}
zipit() { # folder zipname
  (cd out && rm -f "$2" && zip -qry "$2" "$1") && echo "zipped out/$2"
}
for t in "${targets[@]}"; do
  case "$t" in
    win)   pack win32 x64;   updater windows Updater.exe "Last Colony-win32-x64" LastColony-Windows.zip; zipit "Last Colony-win32-x64" LastColony-Windows.zip
           setup windows LastColonySetup.exe ;;
    linux) pack linux x64;   updater linux updater "Last Colony-linux-x64" LastColony-Linux.zip; zipit "Last Colony-linux-x64" LastColony-Linux.zip
           setup linux LastColonySetup-Linux ;;
    mac)   pack darwin x64;  zipit "Last Colony-darwin-x64" LastColony-macOS-Intel.zip
           pack darwin arm64; zipit "Last Colony-darwin-arm64" LastColony-macOS-AppleSilicon.zip ;;
    *) echo "unknown target $t (use win, linux or mac)"; exit 1 ;;
  esac
done
