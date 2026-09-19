# Changelog

## 0.2.0 — Unreleased

### Renamed

- Folio is now **Riffdown**, including the app, native menus, Quick Look display name, and package names.
- The application and extension identifiers, saved preferences, and default reading-style ID remain stable so existing installations retain their settings and Markdown associations.
- Published v0.1.0 packages and the existing product video retain their original Folio name.

### Added

- Close the current document with the × beside its name, File → Close Document, or ⌘W / Ctrl+W. Folio stays open with an empty reader and an Open button.
- A playable 30-second walkthrough in the GitHub README, with its Remotion source in `video/`.
- Custom tint in Appearance: five preset swatches, the system color picker, and a Neutral reset. Changes preview immediately and persist across restarts.
- Automatic accent contrast adjustment for custom colors in light and dark mode, across all four reading styles.

### Changed

- Folio shows one file at a time. Opening another file replaces the previous preview; the sidebar focuses on the current document’s outline. Closing clears search and source content, releases the document session, and stops live refresh.
- Folio’s default page and app controls use a neutral palette in place of the green tint. The shared Quick Look default is neutral too; custom app preferences are not shared with Quick Look.
- Refreshed the README screenshot and appearance instructions.

Validation: 8 renderer tests, 15 browser interaction tests, 20 Rust tests, the local Mac build, the Swift Quick Look smoke test, and strict bundle signature checks pass. The rebuilt Mac app was checked with ⌘W, the close button, and ⌘O from the empty reader. The macOS color picker was opened in the earlier tint build. On September 18, Finder Space-bar rendering, double-click opening in Folio, and opening the same file in iA Writer were verified with the public video demo. Cross-platform automated checks and package builds are tracked in [GitHub Actions](https://github.com/woodcreeper/folio/actions/workflows/build.yml). On September 18, 2026, the user confirmed Folio works on an x86_64 Omarchy 4.0.4-1 machine. The new Close command, installer behavior, file associations, and external-editor launching still need individual hands-on checks on Windows/Linux.

## 0.1.0 — 2026-09-17

First desktop preview: four reading styles, light/dark/system appearance, outline, search, source view, external editor selection, automatic refresh preserving reading position, and an experimental macOS Quick Look extension.

Published packages: universal Mac ZIP, Windows x64 installer, and Linux x64 DEB/AppImage. See the [release](https://github.com/woodcreeper/folio/releases/tag/v0.1.0) for downloads and [preview notes](docs/RELEASE_NOTES.md) for limitations.
