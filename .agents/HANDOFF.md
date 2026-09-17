# Folio session handoff

**Date:** 2026-09-17
**Focus:** Publish Folio's first desktop preview and installation documentation; preserve Omarchy exploration before shutdown.

## Completed

- Built Folio: a lightweight Tauri/TypeScript Markdown reader with a Swift macOS Quick Look extension, four reading styles, appearance controls, outline/search/source view, external editor selection, and live refresh preserving position.
- Connected the existing local project to the user's public repository, preserving its initial commit: https://github.com/woodcreeper/folio.
- Added a screenshot-led README with Mac, Windows, and Linux installation instructions; build-from-source docs; MIT license approved by the user; pinned GitHub Actions; release asset/checksum preparation.
- Saved experimental Arch packaging and a **manual-only** Arch/Wayland workflow separately from the main release pipeline. It is explicitly unverified and not included in the first release.

## Git and release state

- Branch: `main`, tracking `origin/main`.
- `730a5e08fc228858b918ff94562cb9707faeb0f9`: full app, README, license, and build workflow. All three platform build jobs passed at this exact commit.
- `a7d5623`: installation clarifications and package author/license metadata.
- `ac57f31`: saved Omarchy experiment and documentation. No app behavior changes since the tested build.
- First preview is published at https://github.com/woodcreeper/folio/releases/tag/v0.1.0 with universal Mac ZIP, Windows NSIS installer, Linux DEB/AppImage, and SHA256SUMS.txt. Assets are from the successful build at `730a5e0`, not rebuilt from later metadata changes.
- Build: https://github.com/woodcreeper/folio/actions/runs/35278637065.
- Normal pushes build only. Manual main workflow runs with a version publish a prerelease after all builds pass. Avoid rerunning `0.1.0` after it exists.

## Validation

- Local: 8 renderer tests and production TypeScript/Vite builds pass. Earlier local validation: 19 Rust tests, 11 Playwright tests, Swift Quick Look smoke test, and strict native bundle signatures pass.
- GitHub Actions: Mac, Windows, and Linux native tests and release packaging **all passed**. Linux browser interaction tests passed. Mac package is universal (Apple Silicon + Intel); Windows/Linux are x64.
- Release collector was checked with nested fixtures, four SHA-256 entries, and rejection of a mismatched version.
- New experimental Arch shell scripts pass `bash -n`; workflow YAML parses. **No Arch package build or Wayland startup test has run.**
- README local links checked; screenshot contains only Folio's built-in sample, no private documents.
- Local Vite server PID 84128 was verified as belonging to this project and stopped for shutdown. Native Folio was left alone.

## Known limitations

- Preview Mac builds are ad-hoc signed, not Developer ID-signed/notarized. Windows installers are unsigned. Instructions explain OS warnings.
- Mac Quick Look compiles, its renderer passes tests, and registration was observed. `qlmanage -p` crashed in Apple's ExtensionFoundation on the development machine before rendering. Actual Finder Space-bar acceptance still needs verification.
- Windows/Linux installer interaction, desktop file associations, and actual external editor launches still need hands-on verification. Passing CI is not proof of complete desktop integration.
- Native images are restricted to local raster images under the document directory. Remote images/raw HTML/SVG are inert. Quick Look uses default Folio style and image placeholders.
- Built-in editing, annotations, mobile, Mermaid/math, and local Markdown-to-Markdown links remain future work.

## Next session: Omarchy

The user explicitly wants Omarchy compatibility, notes that **Omarchy has its own plugin paradigm**, and wants to avoid building something redundant if its native tools already meet the need. They have an **Omarchy machine at home for testing later**. They asked to stop now and resume later; do not continue researching or building autonomously after closeout.

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
