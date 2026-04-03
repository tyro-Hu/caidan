#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SOURCE_ICON="$ROOT_DIR/resources/beibei-icon-1024.png"
SOURCE_FG="$ROOT_DIR/resources/beibei-icon-foreground-1024.png"
SOURCE_SPLASH="$ROOT_DIR/resources/beibei-splash-2732.png"

for spec in "mdpi 48" "hdpi 72" "xhdpi 96" "xxhdpi 144" "xxxhdpi 192"; do
  density="${spec%% *}"
  size="${spec##* }"

  sips -z "$size" "$size" "$SOURCE_ICON" \
    --out "$ROOT_DIR/android/app/src/main/res/mipmap-$density/ic_launcher.png" >/dev/null
  sips -z "$size" "$size" "$SOURCE_ICON" \
    --out "$ROOT_DIR/android/app/src/main/res/mipmap-$density/ic_launcher_round.png" >/dev/null
  sips -z "$size" "$size" "$SOURCE_FG" \
    --out "$ROOT_DIR/android/app/src/main/res/mipmap-$density/ic_launcher_foreground.png" >/dev/null
done

for spec in \
  "$ROOT_DIR/android/app/src/main/res/drawable/splash.png|320|480" \
  "$ROOT_DIR/android/app/src/main/res/drawable-port-mdpi/splash.png|480|320" \
  "$ROOT_DIR/android/app/src/main/res/drawable-port-hdpi/splash.png|800|480" \
  "$ROOT_DIR/android/app/src/main/res/drawable-port-xhdpi/splash.png|1280|720" \
  "$ROOT_DIR/android/app/src/main/res/drawable-port-xxhdpi/splash.png|1600|960" \
  "$ROOT_DIR/android/app/src/main/res/drawable-port-xxxhdpi/splash.png|1920|1280" \
  "$ROOT_DIR/android/app/src/main/res/drawable-land-mdpi/splash.png|320|480" \
  "$ROOT_DIR/android/app/src/main/res/drawable-land-hdpi/splash.png|480|800" \
  "$ROOT_DIR/android/app/src/main/res/drawable-land-xhdpi/splash.png|720|1280" \
  "$ROOT_DIR/android/app/src/main/res/drawable-land-xxhdpi/splash.png|960|1600" \
  "$ROOT_DIR/android/app/src/main/res/drawable-land-xxxhdpi/splash.png|1280|1920"; do
  target="${spec%%|*}"
  rest="${spec#*|}"
  height="${rest%%|*}"
  width="${rest##*|}"

  sips -c "$height" "$width" "$SOURCE_SPLASH" --out "$target" >/dev/null
done

cp "$SOURCE_ICON" \
  "$ROOT_DIR/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
cp "$SOURCE_SPLASH" \
  "$ROOT_DIR/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png"
cp "$SOURCE_SPLASH" \
  "$ROOT_DIR/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png"
cp "$SOURCE_SPLASH" \
  "$ROOT_DIR/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png"

echo "Brand assets updated for Android and iOS."
