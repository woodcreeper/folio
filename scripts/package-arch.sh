#!/usr/bin/env bash
set -euo pipefail
# Run as a non-root user on Arch with runtime dependencies already installed.
FOLIO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FOLIO_DEB="$(realpath "${1:?Pass the Linux release .deb path}")"
FOLIO_VERSION="$(node -p 'JSON.parse(require("fs").readFileSync(process.argv[1])).version' "$FOLIO_ROOT/package.json")"
[[ "$FOLIO_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
FOLIO_STAGE="$(mktemp -d)"
trap 'rm -rf "$FOLIO_STAGE"' EXIT
cp "$FOLIO_DEB" "$FOLIO_STAGE/slaydown.deb"
cp "$FOLIO_ROOT/LICENSE" "$FOLIO_STAGE/LICENSE"
FOLIO_DEB_SHA="$(sha256sum "$FOLIO_STAGE/slaydown.deb" | cut -d ' ' -f 1)"
FOLIO_LICENSE_SHA="$(sha256sum "$FOLIO_STAGE/LICENSE" | cut -d ' ' -f 1)"
sed -e "s/@VERSION@/$FOLIO_VERSION/g" -e "s/@DEB_SHA256@/$FOLIO_DEB_SHA/g" -e "s/@LICENSE_SHA256@/$FOLIO_LICENSE_SHA/g" \
  "$FOLIO_ROOT/packaging/arch/PKGBUILD.in" > "$FOLIO_STAGE/PKGBUILD"
cd "$FOLIO_STAGE"
makepkg --noconfirm
mkdir -p "$FOLIO_ROOT/release-assets"
cp ./*.pkg.tar.zst "$FOLIO_ROOT/release-assets/"
