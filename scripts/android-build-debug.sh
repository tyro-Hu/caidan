#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

source "$SCRIPT_DIR/android-env.sh"

cd "$ROOT_DIR"
npm run build
npx cap sync android
./android/gradlew -p ./android assembleDebug

echo
echo "APK ready:"
echo "$ROOT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
