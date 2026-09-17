#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Quick Look extensions can only be built on macOS." >&2
  exit 1
fi

FOLIO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FOLIO_BUILD="$FOLIO_ROOT/macos/build"
FOLIO_EXTENSION="$FOLIO_BUILD/FolioQuickLook.appex"
FOLIO_SOURCE="$FOLIO_ROOT/macos/QuickLook"
FOLIO_ASSETS="$FOLIO_ROOT/dist-renderer"
FOLIO_SDK="$(xcrun --sdk macosx --show-sdk-path)"
FOLIO_IDENTITY="${FOLIO_SIGNING_IDENTITY:--}"
FOLIO_MIN_OS="12.0"

for asset in renderer.js reader.css; do
  if [[ ! -f "$FOLIO_ASSETS/$asset" ]]; then
    echo "Missing dist-renderer/$asset. Build the shared renderer first." >&2
    exit 1
  fi
done

mkdir -p "$FOLIO_EXTENSION/Contents/MacOS" "$FOLIO_EXTENSION/Contents/Resources" "$FOLIO_BUILD/module-cache"
cp "$FOLIO_SOURCE/Info.plist" "$FOLIO_EXTENSION/Contents/Info.plist"
cp "$FOLIO_ASSETS/renderer.js" "$FOLIO_ASSETS/reader.css" "$FOLIO_EXTENSION/Contents/Resources/"

# A single universal extension works with either architecture of the host app.
FOLIO_BINARIES=()
read -r -a FOLIO_TARGET_ARCHS <<< "${FOLIO_ARCHS:-arm64 x86_64}"
for arch in "${FOLIO_TARGET_ARCHS[@]}"; do
  case "$arch" in arm64|x86_64) ;; *) echo "Unsupported architecture: $arch" >&2; exit 1 ;; esac
  binary="$FOLIO_BUILD/FolioQuickLook-$arch"
  xcrun swiftc -parse-as-library -emit-executable -O -swift-version 5 \
    -application-extension -module-name FolioQuickLook \
    -module-cache-path "$FOLIO_BUILD/module-cache" \
    -target "$arch-apple-macosx$FOLIO_MIN_OS" -sdk "$FOLIO_SDK" \
    -framework Cocoa -framework Quartz -framework JavaScriptCore -framework UniformTypeIdentifiers \
    -Xlinker -e -Xlinker _NSExtensionMain \
    "$FOLIO_SOURCE/PreviewProvider.swift" "$FOLIO_SOURCE/MarkdownPreviewRenderer.swift" \
    -o "$binary"
  FOLIO_BINARIES+=("$binary")
done
xcrun lipo -create "${FOLIO_BINARIES[@]}" -output "$FOLIO_EXTENSION/Contents/MacOS/FolioQuickLook"

FOLIO_SIGN_ARGS=(--force --sign "$FOLIO_IDENTITY" --entitlements "$FOLIO_SOURCE/QuickLook.entitlements")
if [[ "$FOLIO_IDENTITY" != "-" ]]; then
  FOLIO_SIGN_ARGS+=(--options runtime --timestamp)
fi
codesign "${FOLIO_SIGN_ARGS[@]}" "$FOLIO_EXTENSION"
plutil -lint "$FOLIO_EXTENSION/Contents/Info.plist" "$FOLIO_SOURCE/QuickLook.entitlements"
codesign --verify --strict --verbose=2 "$FOLIO_EXTENSION"

if [[ "${1:-}" == "--test" ]]; then
  xcrun swiftc -O -swift-version 5 -module-cache-path "$FOLIO_BUILD/module-cache" \
    -sdk "$FOLIO_SDK" -framework Foundation -framework JavaScriptCore \
    "$FOLIO_SOURCE/MarkdownPreviewRenderer.swift" "$FOLIO_ROOT/macos/Tests/SmokeTest.swift" \
    -o "$FOLIO_BUILD/FolioPreviewSmokeTest"
  "$FOLIO_BUILD/FolioPreviewSmokeTest" "$FOLIO_EXTENSION"
fi

echo "Built $FOLIO_EXTENSION"
