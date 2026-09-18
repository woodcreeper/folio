# Folio session handoff

**Date:** 2026-09-18
**Focus:** Revise the product video around AI-generated Markdown → Finder Space bar → double-click into Folio → local editor, with more upbeat music. Work stays on `codex/folio-product-video`. The user has confirmed Folio works on Omarchy.

## Completed

- Added the neutral default, five tint presets, the system color picker, a Neutral reset, and persisted tint independent of style/theme/size. Accent colors adjust for readable contrast. No new runtime dependency.
- Rebuilt and reopened the local Mac app; verified the native color picker opens. README instructions and screenshot, architecture notes, Quick Look scope, and the changelog reflect the change.

- Built Folio: a lightweight Tauri/TypeScript Markdown reader with a Swift macOS Quick Look extension, four reading styles, appearance controls, outline/search/source view, external editor selection, and live refresh preserving position.
- Connected the existing local project to the user's public repository, preserving its initial commit: https://github.com/woodcreeper/folio.
- Added a screenshot-led README with Mac, Windows, and Linux installation instructions; build-from-source docs; MIT license approved by the user; pinned GitHub Actions; release asset/checksum preparation.
- Saved experimental Arch packaging and a **manual-only** Arch/Wayland workflow separately from the main release pipeline. It is explicitly unverified and not included in the first release.

## Git and release state

- Integrated into `main` at `b0e288a` on 2026-09-17, following the user’s approval. The tint feature was developed on `codex/custom-tint`, created from `ca334ca`; the merge was a fast-forward with no conflicting remote changes.
- `6459638`: neutral palette and custom tint feature. `1978858`: README, changelog, platform notes, and handoff updates. Both are pushed and included in `main`. No new release downloads have been published.
- `730a5e08fc228858b918ff94562cb9707faeb0f9`: full app, README, license, and build workflow. All three platform build jobs passed at this exact commit.
- `a7d5623`: installation clarifications and package author/license metadata.
- `ac57f31`: saved Omarchy experiment and documentation. This was the last packaging-only change before the tint feature.
- First preview is published at https://github.com/woodcreeper/folio/releases/tag/v0.1.0 with universal Mac ZIP, Windows NSIS installer, Linux DEB/AppImage, and SHA256SUMS.txt. Assets are from the successful build at `730a5e0`, not rebuilt from later metadata changes.
- Build: https://github.com/woodcreeper/folio/actions/runs/35278637065.
- Pushes to `main` and pull requests build only; feature-branch pushes alone do not trigger CI. Manual main workflow runs with a version publish a prerelease after all builds pass. Avoid rerunning `0.1.0` after it exists.

## Validation

- Tint feature: 8 renderer tests, 13 Playwright tests, production TypeScript/Vite builds, the Mac app build, Swift Quick Look smoke test, and strict native bundle signatures pass. Browser checks cover persistence/reset, unchanged document content, independent appearance preferences, and extreme-color contrast across all four styles in system light/dark mode.
- Earlier local validation: 19 Rust tests pass; no Rust behavior changed. The merged source passed automated checks and package builds for Mac, Windows, and Linux in [build run 35304846135](https://github.com/woodcreeper/folio/actions/runs/35304846135). Build artifacts are available on that run; the published v0.1.0 release assets remain unchanged.
- GitHub Actions for the published v0.1.0 commit: Mac, Windows, and Linux native tests and release packaging **all passed**. Linux browser interaction tests passed. Mac package is universal (Apple Silicon + Intel); Windows/Linux are x64.
- Release collector was checked with nested fixtures, four SHA-256 entries, and rejection of a mismatched version.
- New experimental Arch shell scripts pass `bash -n`; workflow YAML parses. **No Arch package build or Wayland startup test has run.**
- README local links checked; screenshot contains only Folio's built-in sample, no private documents.
- The local Vite verification server was stopped after testing. Updated native Folio is running from `src-tauri/target/release/bundle/macos/Folio.app`. The old `build/Folio-macOS-arm64.zip` has not been regenerated for this feature.

## Known limitations

- Preview Mac builds are ad-hoc signed, not Developer ID-signed/notarized. Windows installers are unsigned. Instructions explain OS warnings.
- Actual Finder Space-bar preview succeeded on 2026-09-18 with the public video plan, rendering headings, a quote, tasks, and a table in light mode. Double-clicking the demo file opened Folio, and Open in Editor opened the same file in iA Writer. The earlier `qlmanage -p` crash is a separate tooling issue. Quick Look dark mode, missing images, and broader Mac coverage still need checks.
- Windows/Linux installer interaction, desktop file associations, and actual external editor launches still need hands-on verification. Passing CI is not proof of complete desktop integration.
- Native images are restricted to local raster images under the document directory. Remote images/raw HTML/SVG are inert. Quick Look uses the neutral default Folio style and image placeholders. App reading-style/tint/size preferences are not shared with the extension.
- Built-in editing, annotations, mobile, Mermaid/math, and local Markdown-to-Markdown links remain future work.

## Omarchy work on the other machine

On **2026-09-18**, the user confirmed that **Folio works on their x86_64 Omarchy machine, version 4.0.4-1**. They are working on that side independently. Their earlier report of unformatted Markdown concerned the existing Space-bar preview and OmaWrite. The successful Folio test supersedes the previous lack of hardware confirmation; its installation method and individual integration checks were not specified. They want Omarchy support and consideration of its plugin model. Coordinate through Git without overwriting work from that machine. Pull the latest `main` to include the merged tint feature and documentation. Check for local changes before syncing the Omarchy checkout.

Remaining compatibility checks:

1. Start with product/compatibility research: https://omarchy.org/manual/ and its linked plugin catalog. Inspect its current native Markdown viewer/preview tools and plugin format before deciding whether Folio should integrate as an app, plugin, or neither.
2. Read `packaging/arch/README.md`. Saved files: `PKGBUILD.in`, `scripts/package-arch.sh`, `scripts/smoke-wayland.sh`, `.github/workflows/arch-preview.yml`. The draft repackages the tested Ubuntu binary to avoid depending on a newer glibc than Omarchy's lagged Arch mirror.
3. If appropriate, run the experimental workflow with successful build run ID `35278637065`. It attempts Arch dependency/desktop-file validation and native window startup under headless Weston. This does not prove Hyprland or actual document rendering.
4. Record the installation method used for the successful hardware test and check any remaining desktop behaviors: file picker, file associations, typography, HiDPI, themes, external editors, atomic-save refresh, and uninstall. Terminal-only editors such as Neovim need a terminal wrapper; selecting the executable alone does not launch a terminal window.
5. Document Folio as user-confirmed working on Omarchy 4.0.4-1 x86_64. Keep the separate Arch package/workflow marked experimental until verified. No Arch package, AUR listing, or Omarchy plugin is published.

## Product video revision — 2026-09-18

- Revised script: `video/SCRIPT.md`. New story: AI agent output → Finder file selection → Space bar Quick Look → double-click into Folio → outline/search/appearance → local editor.
- New export: `video/out/Folio-Final.mp4`, 42 seconds, 1080p, 30 fps, 5.27 MB. The feature scene cycles through VS Code + blue and iA Writer + amber using real native screenshots. The user approved the warm music; its exact AAC stream is preserved in this final cut (matching audio-stream hashes). Full decode and inspection of both new shots passed. Generated output/audio remain ignored; screenshot assets and source are versioned.
- Native screenshots are in `video/public/screenshots/workflow-*.png`, using only the new public fixtures in `video/public/Agent workspace/`. Native Finder, Folio, and iA Writer workflow acceptance succeeded while capturing them.
- Only PLAN.md was associated with Folio; the global Markdown default was not changed. Finder sidebar, Folio's GitHub/dark/blue/14 appearance, and iA Writer's window/preview mode were restored after capture.
- Earlier 40-second export remains locally available under its original name. `npm run capture --prefix video` still captures legacy browser assets; current native screenshots are already committed for rendering.
- This branch has not been pushed or merged. Published v0.1.0 release downloads are unchanged.

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
