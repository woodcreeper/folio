# Folio session handoff

**Date:** 2026-09-17
**Focus:** Custom tint and a neutral default for the Mac app; push the approved feature and current documentation. The user is independently working on the adjacent Omarchy machine.

## Completed

- Added the neutral default, five tint presets, the system color picker, a Neutral reset, and persisted tint independent of style/theme/size. Accent colors adjust for readable contrast. No new runtime dependency.
- Rebuilt and reopened the local Mac app; verified the native color picker opens. README instructions and screenshot, architecture notes, Quick Look scope, and the changelog reflect the change.

- Built Folio: a lightweight Tauri/TypeScript Markdown reader with a Swift macOS Quick Look extension, four reading styles, appearance controls, outline/search/source view, external editor selection, and live refresh preserving position.
- Connected the existing local project to the user's public repository, preserving its initial commit: https://github.com/woodcreeper/folio.
- Added a screenshot-led README with Mac, Windows, and Linux installation instructions; build-from-source docs; MIT license approved by the user; pinned GitHub Actions; release asset/checksum preparation.
- Saved experimental Arch packaging and a **manual-only** Arch/Wayland workflow separately from the main release pipeline. It is explicitly unverified and not included in the first release.

## Git and release state

- Working branch: `codex/custom-tint`, tracking `origin/codex/custom-tint`; created from `ca334ca`.
- `6459638`: neutral palette and custom tint feature, approved by the user and pushed. A follow-up documentation commit records the current state. These changes have not been merged to `main` or published as new release downloads.
- `730a5e08fc228858b918ff94562cb9707faeb0f9`: full app, README, license, and build workflow. All three platform build jobs passed at this exact commit.
- `a7d5623`: installation clarifications and package author/license metadata.
- `ac57f31`: saved Omarchy experiment and documentation. This was the last packaging-only change before the tint feature.
- First preview is published at https://github.com/woodcreeper/folio/releases/tag/v0.1.0 with universal Mac ZIP, Windows NSIS installer, Linux DEB/AppImage, and SHA256SUMS.txt. Assets are from the successful build at `730a5e0`, not rebuilt from later metadata changes.
- Build: https://github.com/woodcreeper/folio/actions/runs/35278637065.
- Pushes to `main` and pull requests build only; feature-branch pushes alone do not trigger CI. Manual main workflow runs with a version publish a prerelease after all builds pass. Avoid rerunning `0.1.0` after it exists.

## Validation

- Tint feature: 8 renderer tests, 13 Playwright tests, production TypeScript/Vite builds, the Mac app build, Swift Quick Look smoke test, and strict native bundle signatures pass. Browser checks cover persistence/reset, unchanged document content, independent appearance preferences, and extreme-color contrast across all four styles in system light/dark mode.
- Earlier local validation: 19 Rust tests pass; no Rust behavior changed. Updated Windows/Linux packages have not been built for the tint feature.
- GitHub Actions for the published v0.1.0 commit: Mac, Windows, and Linux native tests and release packaging **all passed**. Linux browser interaction tests passed. Mac package is universal (Apple Silicon + Intel); Windows/Linux are x64.
- Release collector was checked with nested fixtures, four SHA-256 entries, and rejection of a mismatched version.
- New experimental Arch shell scripts pass `bash -n`; workflow YAML parses. **No Arch package build or Wayland startup test has run.**
- README local links checked; screenshot contains only Folio's built-in sample, no private documents.
- The local Vite verification server was stopped after testing. Updated native Folio is running from `src-tauri/target/release/bundle/macos/Folio.app`. The old `build/Folio-macOS-arm64.zip` has not been regenerated for this feature.

## Known limitations

- Preview Mac builds are ad-hoc signed, not Developer ID-signed/notarized. Windows installers are unsigned. Instructions explain OS warnings.
- Mac Quick Look compiles, its renderer passes tests, and registration was observed. `qlmanage -p` crashed in Apple's ExtensionFoundation on the development machine before rendering. Actual Finder Space-bar acceptance still needs verification.
- Windows/Linux installer interaction, desktop file associations, and actual external editor launches still need hands-on verification. Passing CI is not proof of complete desktop integration.
- Native images are restricted to local raster images under the document directory. Remote images/raw HTML/SVG are inert. Quick Look uses the neutral default Folio style and image placeholders. App reading-style/tint/size preferences are not shared with the extension.
- Built-in editing, annotations, mobile, Mermaid/math, and local Markdown-to-Markdown links remain future work.

## Omarchy work on the other machine

The user has resumed with an adjacent **x86_64 Omarchy machine, version 4.0.4-1**, and is working on that side independently. They reported that the existing Space-bar preview and OmaWrite displayed unformatted Markdown; this is not yet a Folio compatibility test. They want Omarchy support and consideration of its plugin model. Coordinate through Git without overwriting work from that machine. The tint changes currently live on `codex/custom-tint`, so checking out only `main` will not include them.

Remaining compatibility checks:

1. Start with product/compatibility research: https://omarchy.org/manual/ and its linked plugin catalog. Inspect its current native Markdown viewer/preview tools and plugin format before deciding whether Folio should integrate as an app, plugin, or neither.
2. Read `packaging/arch/README.md`. Saved files: `PKGBUILD.in`, `scripts/package-arch.sh`, `scripts/smoke-wayland.sh`, `.github/workflows/arch-preview.yml`. The draft repackages the tested Ubuntu binary to avoid depending on a newer glibc than Omarchy's lagged Arch mirror.
3. If appropriate, run the experimental workflow with successful build run ID `35278637065`. It attempts Arch dependency/desktop-file validation and native window startup under headless Weston. This does not prove Hyprland or actual document rendering.
4. Test on the user's home machine: launch/file picker, file associations, typography, HiDPI, themes, external editors, atomic-save refresh, and uninstall. Terminal-only editors such as Neovim need a terminal wrapper; selecting the executable alone does not launch a terminal window.
5. Keep Omarchy support marked experimental until verified. No Arch package, AUR listing, or Omarchy plugin is published.

## Useful commands

```sh
npm ci
npm run desktop
npm test
npm run build
cargo test --locked --manifest-path src-tauri/Cargo.toml
npm run desktop:build -- --bundles app # on macOS; includes Quick Look
```

This checkout also has ignored optional toolchains under `.tools/`; `scripts/tauri.mjs` uses them automatically. For direct local Cargo commands if Rust is not on PATH:

```sh
CARGO_HOME="$PWD/.tools/cargo" RUSTUP_HOME="$PWD/.tools/rustup" \
  .tools/cargo/bin/cargo test --locked --manifest-path src-tauri/Cargo.toml
```
