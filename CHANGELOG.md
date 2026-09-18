# Changelog

## Unreleased

### Added

- Custom tint in Appearance: five preset swatches, the system color picker, and a Neutral reset. Changes preview immediately and persist across restarts.
- Automatic accent contrast adjustment for custom colors in light and dark mode, across all four reading styles.

### Changed

- Folio’s default page and app controls use a neutral palette in place of the green tint. The shared Quick Look default is neutral too; custom app preferences are not shared with Quick Look.
- Refreshed the README screenshot and appearance instructions.

Validation: 8 renderer tests, 13 browser interaction tests, the local Mac build, the Swift Quick Look smoke test, and strict bundle signature checks pass. The macOS color picker was opened in the rebuilt app. Cross-platform automated checks and package builds are tracked in [GitHub Actions](https://github.com/woodcreeper/folio/actions/runs/35304846135). On September 18, 2026, the user confirmed Folio works on an x86_64 Omarchy 4.0.4-1 machine. Windows/Linux installer behavior, file associations, and external-editor launching have not been individually verified.

## 0.1.0 — 2026-09-17

First desktop preview: four reading styles, light/dark/system appearance, outline, search, source view, external editor selection, automatic refresh preserving reading position, and an experimental macOS Quick Look extension.

Published packages: universal Mac ZIP, Windows x64 installer, and Linux x64 DEB/AppImage. See the [release](https://github.com/woodcreeper/folio/releases/tag/v0.1.0) for downloads and [preview notes](docs/RELEASE_NOTES.md) for limitations.
