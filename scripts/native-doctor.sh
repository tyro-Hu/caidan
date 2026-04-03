#!/bin/zsh

set -u

function check_cmd() {
  local name="$1"
  local label="$2"

  if command -v "$name" >/dev/null 2>&1; then
    echo "[ok] $label: $(command -v "$name")"
  else
    echo "[missing] $label"
  fi
}

function check_runnable() {
  local label="$1"
  shift

  if "$@" >/tmp/caipu-native-doctor.out 2>/tmp/caipu-native-doctor.err; then
    local first_line
    first_line="$(sed -n '1p' /tmp/caipu-native-doctor.out)"
    if [[ -z "$first_line" ]]; then
      first_line="$(sed -n '1p' /tmp/caipu-native-doctor.err)"
    fi
    echo "[ok] $label: $first_line"
  else
    local first_line
    first_line="$(sed -n '1p' /tmp/caipu-native-doctor.err)"
    if [[ -z "$first_line" ]]; then
      first_line="$(sed -n '1p' /tmp/caipu-native-doctor.out)"
    fi
    echo "[missing] $label"
    if [[ -n "$first_line" ]]; then
      echo "         $first_line"
    fi
  fi
}

echo "== 贝贝点菜 Native Doctor =="
echo

echo "-- Android --"
if [[ -x "./.tooling/jdk21/Contents/Home/bin/java" ]]; then
  echo "[ok] local Java runtime: ./.tooling/jdk21/Contents/Home/bin/java"
else
  check_runnable "Java runtime" java -version
fi

if [[ -x "./.tooling/jdk21/Contents/Home/bin/javac" ]]; then
  echo "[ok] local Java compiler: ./.tooling/jdk21/Contents/Home/bin/javac"
else
  check_runnable "Java compiler" javac -version
fi

check_cmd adb "Android Debug Bridge"
check_cmd sdkmanager "Android SDK manager"

if [[ -x "./.tooling/android-sdk/platform-tools/adb" ]]; then
  echo "[ok] local Android Debug Bridge: ./.tooling/android-sdk/platform-tools/adb"
fi

if [[ -x "./.tooling/android-sdk/cmdline-tools/latest/bin/sdkmanager" ]]; then
  echo "[ok] local Android SDK manager: ./.tooling/android-sdk/cmdline-tools/latest/bin/sdkmanager"
fi

if [[ -n "${ANDROID_HOME:-}" ]]; then
  echo "[ok] ANDROID_HOME: $ANDROID_HOME"
else
  echo "[missing] ANDROID_HOME"
fi

if [[ -n "${ANDROID_SDK_ROOT:-}" ]]; then
  echo "[ok] ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"
else
  echo "[missing] ANDROID_SDK_ROOT"
fi

if [[ -d "./.tooling/android-sdk/platforms/android-36" ]]; then
  echo "[ok] local Android platform: android-36"
fi

if [[ -d "./.tooling/android-sdk/build-tools/35.0.0" ]]; then
  echo "[ok] local Android build-tools: 35.0.0"
fi

echo
echo "-- iOS --"
check_runnable "xcodebuild" xcodebuild -version

if [[ -d "/Applications/Xcode.app" ]]; then
  echo "[ok] Xcode app: /Applications/Xcode.app"
else
  echo "[missing] /Applications/Xcode.app"
fi

if command -v xcode-select >/dev/null 2>&1; then
  echo "[info] xcode-select path: $(xcode-select -p 2>/dev/null || echo unavailable)"
fi

echo
echo "-- Capacitor Project --"
if [[ -d "android" ]]; then
  echo "[ok] android project exists"
else
  echo "[missing] android project"
fi

if [[ -d "ios" ]]; then
  echo "[ok] ios project exists"
else
  echo "[missing] ios project"
fi

if [[ -d "out" ]]; then
  echo "[ok] exported web assets exist"
else
  echo "[missing] out export directory"
fi
