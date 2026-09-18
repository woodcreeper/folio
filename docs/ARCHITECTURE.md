# Architecture and continuation

Folio is a desktop-first Markdown viewer with a shared rendering core. Mobile is intentionally deferred. The working name and colors are provisional; neither affects the file format or native integration.

## Boundaries

- `src/renderer.ts`: synchronous Markdown → HTML, headings, approximate reading statistics. No DOM, file access, or native API. Bundles to `FolioRenderer` for JavaScriptCore.
- `src/reader.css`: common typography, code colors, and themes. App chrome is separate in `src/style.css`.
- `src/tint.ts`: optional color tint over the CSS palette for both app chrome and reading surfaces. Reads each preset’s default tokens, prepares light/dark variants, and adjusts accent contrast against their backgrounds. Preferences store only the chosen hex color (or `null` for neutral), alongside style, theme, and size.
- `src/main.ts`: document selection, outline, source view, search, theme/size controls, and presentation. Keeps original source separate from rendered HTML.
- `src/reading-position.ts`: captures the visible block and nearby headings, restores that anchor after document changes, and falls back to proportional position when no matching block survives. Explicit navigation invalidates late image restoration.
- `src/platform.ts`: browser/desktop boundary and common document shape `{ name, path, content }`.
- `src-tauri/src/documents.rs`: read-only local document session and bounded local image loading. Canonical paths constrain image access to an opened document’s directory tree.
- `src-tauri/src/lib.rs`: native picker, OS open events, file associations, and external web/email links. Startup documents stay available until the frontend subscribes.
- `src-tauri/src/editor.rs`: validated application selection and preference persistence. Launches only the selected app with the authorized document as a literal argument. Prevents opening Folio recursively.
- `src-tauri/src/watcher.rs`: one native parent-directory subscription for the current document; handles atomic saves, debounces events, and stops its worker on replacement. No idle polling.
- `macos/QuickLook`: sandboxed native data-based preview provider. Reads the selected UTF-8 file and uses JavaScriptCore to run the same packaged renderer. No app backend or web bridge exists in the preview process.

## Lightweight choices

The app uses the OS webview through Tauri. It does not include Electron, React, an editor, or a background service. Linux AppImage packaging may include additional runtime libraries for portability. The shared renderer includes only eleven common highlighting grammars. The local Apple Silicon Mac app is approximately 3.8 MB installed (universal and other platform builds differ); build dependencies and caches are much larger and are excluded from the app.

Markdown files are neither uploaded nor written by Folio; the external editor owns edits. Folio writes only its own editor preference, and the frontend stores display preferences. Remote images are placeholders; web and mail links open only after a click. Raw HTML is displayed as text. This makes the rendering behavior predictable for untrusted Markdown, with the same output in the app and Quick Look.

## Editing path

Add an explicit editor pane which changes the source string and reuses `renderMarkdown`. Add saving as a separate native command with a document revision/mtime check and conflict handling. Keep the read-only Quick Look provider independent. The current source viewer is not an editor; no save API or filesystem write permission is present.

Do not add a plugin framework until a concrete feature requires it. Reasonable next increments are local Markdown links, closing open documents, a persistent recent-file list (paths only, after a privacy decision), and opt-in math/diagram rendering.

## Verification recorded 2026-09-17

- TypeScript and production frontend build pass.
- 8 renderer tests pass: syntax, tasks/footnotes, IDs, Unicode, escaping, safe links/images, and reading statistics.
- Browser interaction tests cover baseline viewing, style/tint persistence, accent contrast, editor selection/cancellation, automatic save refresh, temporary disappearance, source position, stale-response protection, and late-image navigation.
- 19 Rust tests pass: document/security checks, editor validation and persistence, literal launch arguments, actual in-place and atomic saves, debounce timing, and worker shutdown.
- Universal native Quick Look compile and JavaScriptCore smoke tests pass.
- Complete Mac app and nested Quick Look extension pass strict code-signature verification using ad-hoc signing.
- macOS detects `net.daringfireball.markdown`; Folio’s Quick Look extension is registered and explicitly enabled.
- Native app launch and opening a real Markdown file were observed. The updated native UI was visually observed with Open in Editor, Live preview, and the VS Code-inspired style. Actual external-editor launch still has no manual end-to-end acceptance record; native argument/validation tests and mocked frontend picker/launch tests pass.
- `qlmanage -p` crashes in Apple’s ExtensionFoundation (`key cannot be nil`) before preview rendering on this machine. That command cannot establish Finder success or extension failure. Direct Finder spacebar acceptance remains a separate check.
- Windows/Linux native tests pass in GitHub Actions. Packaged file associations, installer interaction, and actual external-editor launching still need manual verification on those platforms.

## Local operations

`npm run desktop:build` builds/tests the Quick Look extension automatically on macOS, embeds it, then signs the outer app. The extension must be signed first: Tauri’s extra-file mapping does not independently sign nested extensions. The default identity `-` is for local development; Developer ID signing/notarization is needed for trusted Mac distribution without unidentified-developer warnings; the first public preview is ad-hoc signed. Override host signing settings and `FOLIO_SIGNING_IDENTITY` together for distribution.

The app output is `src-tauri/target/release/bundle/macos/Folio.app`. A zip is available at `build/Folio-macOS-arm64.zip`. Current host architecture is Apple Silicon; the bundled extension contains both Intel and Apple Silicon slices.

Source and installation documentation are published at https://github.com/woodcreeper/folio under the MIT license. The GitHub Actions workflow builds universal Mac, Windows x64, and Linux x64 packages; manual release runs publish only after every platform succeeds. See DEVELOPMENT.md for the release procedure and the Releases page for available binaries.

## Reading-style scope

The app persists `data-reading-style` independently of theme and size. Four lightweight CSS presets share the same rendering output. No parser changes, remote fonts, or extra JS rendering packages are needed. Quick Look keeps the default Folio styling; sharing user preferences with its sandbox is a separate future integration.

## Refresh and launch invariants

Frontend selection and refresh counters reject stale results. Native watcher changes are serialized so delayed requests cannot reselect an earlier file. Recreating a subscription also recovers a failed same-path watcher. Backend reloads of previously authorized files do not replace a newer native startup document. A chooser cancellation launches nothing; files and app paths are passed as separate process arguments. Folio never invokes the shell with document content.
