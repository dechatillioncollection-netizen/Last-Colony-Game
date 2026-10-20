#!/usr/bin/env bash
# Builds the Windows desktop version into electron/out/LastColony-Windows.zip.
# Needs Node and npx; electron-packager is fetched on first use.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf app && mkdir app
cp main.js package.json app/
cp ../index.html app/
cp -r ../art app/art && rm -rf app/art/source
mkdir -p app/audio && cp ../audio/sounds.js app/audio/
npx --yes electron-packager app "Last Colony" --platform=win32 --arch=x64 --electron-version=33.2.1 --out=out --overwrite
cd out && rm -f LastColony-Windows.zip && zip -qr LastColony-Windows.zip "Last Colony-win32-x64"
echo "built electron/out/LastColony-Windows.zip"
