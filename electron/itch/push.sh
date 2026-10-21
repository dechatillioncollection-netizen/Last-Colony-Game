#!/usr/bin/env bash
# Uploads the built folders to itch.io with butler (https://itch.io/docs/butler/). Build first (../build.sh), then:
#   ITCH_GAME=yourname/last-colony ./push.sh
# butler asks you to log in the first time. Pass --userversion to label the build, e.g. ./push.sh --userversion 0.5.0
set -euo pipefail
cd "$(dirname "$0")"
: "${ITCH_GAME:?set ITCH_GAME to yourname/your-game-page}"
butler push "../out/Last Colony-win32-x64"   "$ITCH_GAME:windows" "$@"
butler push "../out/Last Colony-linux-x64"   "$ITCH_GAME:linux" "$@"
butler push "../out/Last Colony-darwin-x64"  "$ITCH_GAME:mac-intel" "$@"
butler push "../out/Last Colony-darwin-arm64" "$ITCH_GAME:mac-apple-silicon" "$@"
