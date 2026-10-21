#!/usr/bin/env bash
# Uploads the built folders to Steam with SteamCMD. Build first (../build.sh), then:
#   STEAM_USER=your_build_account ./upload.sh
# SteamCMD asks for the password and Steam Guard code the first time.
set -euo pipefail
cd "$(dirname "$0")"
: "${STEAM_USER:?set STEAM_USER to the Steam account that uploads builds}"
for d in "Last Colony-win32-x64" "Last Colony-linux-x64" "Last Colony-darwin-x64"; do
  [ -d "../out/$d" ] || { echo "missing ../out/$d: run ../build.sh first"; exit 1; }
done
steamcmd +login "$STEAM_USER" +run_app_build "$(pwd)/app_build.vdf" +quit
