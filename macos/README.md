# macOS Quick Look

Folio includes a separate Swift Quick Look extension so Finder can render Markdown when a file is selected and Space is pressed. The desktop app does not need to be running. This is Quick Look, not the Preview application.

The extension targets macOS 12 and later and uses `QLPreviewProvider` to return HTML. JavaScriptCore runs the same `FolioRenderer.renderMarkdown(source, { preview: true })` bundle as the app, with the same reading stylesheet. The render function must be synchronous and return an object with an `html` string. JavaScriptCore receives no filesystem, network, DOM, or Tauri APIs.

## Build and verify

Install the frontend dependencies, then build the shared renderer and native extension:

```sh
npm run build:renderer
bash scripts/build-quicklook.sh --test
```

This builds a universal Apple Silicon/Intel extension at `macos/build/FolioQuickLook.appex`, checks its property lists and signature, and exercises the actual bundled JavaScript in a native smoke test. It does not install the app or register the extension. Xcode and its macOS SDK are required. Set `FOLIO_ARCHS=arm64` or `FOLIO_ARCHS=x86_64` for a single architecture.

The containing Tauri app must place the extension in `Contents/PlugIns/FolioQuickLook.appex` before its final signing step. Use an opt-in Tauri bundle configuration if the extension is not built for every development run:

```json
{
  "bundle": {
    "macOS": {
      "files": {
        "PlugIns/FolioQuickLook.appex": "../macos/build/FolioQuickLook.appex"
      }
    }
  }
}
```

Local builds are signed ad hoc. The host configuration also sets `signingIdentity: "-"`, so the containing app is sealed as a complete bundle after the extension has been embedded. For distribution, set `FOLIO_SIGNING_IDENTITY` to the Developer ID Application identity used for the containing app, build/sign the extension first, then sign and notarize the complete app. An ad-hoc smoke test does not establish Finder registration or production distribution readiness.

## Scope and limitations

- UTF-8 `.md` and `.markdown` documents resolved by macOS as `net.daringfireball.markdown` are supported. The host app should import that existing type, not invent an incompatible Markdown UTI. Quick Look matches the exact UTI list.
- Documents over 10 MiB return a readable error instead of starting a large rendering job.
- Raw HTML is disabled in the shared renderer. A restrictive HTML Content Security Policy prevents document scripts and network requests. The shared renderer shows image placeholders in Quick Look. Relative images need a separate, sandbox-aware resource strategy before enabling them; the CSP permits only inline data images if a future resolver provides them.
- Editing belongs to the host app. This extension is deliberately a stateless reading surface.

## Finder acceptance checks

Once the containing app is installed and opened, check that its Quick Look extension is enabled in System Settings. Other Markdown preview extensions may compete for the same file type. Verify the actual file type with `mdls -name kMDItemContentType example.md`; inspect registered extensions with `pluginkit -m -v -p com.apple.quicklook.preview`.

Select a Markdown file in Finder and press Space. Test headings, tables, code, task lists, Unicode, light/dark appearance, and missing images. Confirm the Quick Look “Open with Folio” action opens the same document in the app. Also test a file opened while the app is already running. These tests require the installed host application; the native smoke test alone cannot verify them.

## API references

- [Apple Quick Look UI](https://developer.apple.com/documentation/QuickLookUI)
- [Apple Quick Look provider](https://developer.apple.com/documentation/quicklook/qlpreviewprovider)
- [Apple extension and bundle locations](https://developer.apple.com/documentation/bundleresources/placing-content-in-a-bundle)
- [Apple Quick Look file type matching and debugging](https://developer.apple.com/videos/play/wwdc2019/719/)
- [Tauri macOS bundle configuration](https://v2.tauri.app/distribute/macos-application-bundle/)
- [Tauri signing and notarization](https://v2.tauri.app/distribute/sign/macos/)

## Current local verification

The containing app and embedded extension pass strict code-signature verification. macOS has registered Folio’s extension and it has been enabled with `pluginkit`. The command-line `qlmanage -p` tool crashes inside Apple’s ExtensionFoundation on this machine before rendering; use Finder’s Space-bar preview to verify the actual user workflow. The native JavaScriptCore smoke test passes independently.
