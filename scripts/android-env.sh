#!/bin/zsh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export CAIPU_ROOT="$ROOT_DIR"
export JAVA_HOME="$ROOT_DIR/.tooling/jdk21/Contents/Home"
export ANDROID_HOME="$ROOT_DIR/.tooling/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
