# SlayDown 0.2.0 preview

Folio is now **SlayDown**. This release also includes custom tint controls and one-file-at-a-time viewing with Close Document. Existing appearance settings and editor selection are retained.

A local Markdown reader with four reading styles, light/dark appearance, an outline, search, and a source view. Open files in your preferred external editor and see saved changes refresh in place.

## Downloads

- **Mac (Apple Silicon + Intel, macOS 12+):** `SlayDown-macOS-universal.zip`. Unzip and move SlayDown to Applications.
- **Windows x64:** download and run the `-setup.exe` installer.
- **Linux x64:** install the `.deb` on a compatible Ubuntu/Debian desktop, or make the `.AppImage` executable and run it.
- **SHA256SUMS.txt:** checksums for all four packages.

[Full installation instructions](https://github.com/woodcreeper/folio#install) · [Build from source](https://github.com/woodcreeper/folio/blob/main/docs/DEVELOPMENT.md)

## Preview status

These packages are not Developer ID-signed/notarized on Mac or publisher-signed on Windows. Security prompts are expected; follow the installation guide. The Mac bundle is signed ad hoc. The release workflow requires builds and automated tests on all three platforms before publishing. Hands-on Windows/Linux installer and desktop integration testing is still needed.

Mac Quick Look is included and experimental. Enable the extension in System Settings after opening SlayDown once. Its native renderer passes a smoke test; Finder integration needs broader testing. Quick Look uses the default style and image placeholders.

Built-in editing, annotations, mobile, Mermaid, math, and local Markdown-to-Markdown navigation are not included. Raw HTML and remote images stay inert; documents are limited to 10 MiB of UTF-8 Markdown.

[Report a problem](https://github.com/woodcreeper/folio/issues). Please include your OS version and a small non-private example.
