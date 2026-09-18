# Folio product film

A 42-second, 1080p Remotion film about the reason Folio exists: your AI agent creates Markdown files, and you want to read them quickly. The [script and storyboard](SCRIPT.md) follow Finder selection → Space bar Quick Look → double-click into Folio → your local editor.

The film uses real Mac screenshots captured on September 18, 2026, an original warm 120 BPM instrumental score with a relaxed half-time groove, and on-screen copy. An optional voiceover is included in the script; the export has no narration.

## Render the current film

The native screenshots are committed, so no running app or screenshot capture is required to reproduce the edit:

```sh
cd video
npm ci
npm run audio
npm run stills
npm run render
```

Rendering uses installed Google Chrome on Mac; set `REMOTION_BROWSER` to an alternate Chromium executable if needed. Python 3 generates the original score. Typography uses local Iowan Old Style/Baskerville with Georgia fallback; reproduce on Mac for matching type.

- `public/Agent workspace/`: the public demonstration files created for this film.
- `public/screenshots/workflow-*.png`: real Finder, Quick Look, Folio, and iA Writer screenshots.
- `src/FolioFilm.tsx`: scenes, on-screen copy, screenshot crops, timing, and transitions.
- `scripts/soundtrack.py`: deterministic soft keys, rounded bass, and restrained brushed percussion; no external samples or licensed recordings.
- `out/Folio-Final.mp4`: revised H.264/AAC export.

Earlier exports remain available locally. The final cut adds a visible VS Code/blue → iA Writer/amber preset cycle to the 22–28 second feature section and retains the approved warm soundtrack. `npm run capture` is the **legacy browser screenshot workflow**, requiring the root app's dependencies and `npm run dev`; it does not overwrite the new native `workflow-*` captures.

## Native capture record

1. Open `public/Agent workspace/` in Finder and select PLAN.md. Hide the sidebar for the capture so personal locations are excluded.
2. Press Space. Wait for the rendered preview, including headings, the quote, task list, and table. Capture the native Quick Look window.
3. In Finder Get Info, choose Folio under Open With for this demo file only. Do not click Change All. The captured Quick Look action reads “Open with Folio.”
4. Close Quick Look and double-click PLAN.md. The same document opens in the native Folio app.
5. Capture the reader in the neutral Folio style and its real “review” search match. Capture Appearance with VS Code + blue and iA Writer + amber in light mode, at size 17 with the document at the top. These two states cycle in the feature scene; Folio + purple remains in the editor handoff. Windowed captures crop the OS title strip; the two additional preset captures use the expanded native window. Product UI remains unchanged.
6. Capture the selected iA Writer setting, then use Open in Editor. Confirm iA Writer shows the same file path and Markdown content. Capture its source editing view.
7. Restore temporary Finder sidebar, Folio appearance, and editor window/view changes after capture.

Finder rendering, double-click opening, and the external-editor launch all succeeded. No private documents appear in the captured images. Document association is a setup prerequisite for the double-click behavior and is noted on-screen. Space bar preview is labeled as a Mac feature.

The intro document labels, pointer/key illustrations, crops, transitions, and timing are created in Remotion. This is an edited screenshot demonstration, not a continuous recording or a launch-speed measurement. Folio's app source and dependencies were not changed.

## Export verification

The final composition contains 1,260 frames at 1920 × 1080 and 30 fps. The two new style/tint shots were rendered separately and visually checked before the complete export. TypeScript validation passes. Storyboard frames covering all scenes and selected frames decoded from the completed MP4 were visually inspected. Full video and audio decoding completed without errors. The revised audio averages −24.9 dBFS and peaks at −10.6 dBFS, with no clipping. Compared with the first workflow-film soundtrack, the arrangement removes the bright bell line and claps, softens note attacks, simplifies harmony, and leaves more space between phrases. The final MP4 is exactly 42 seconds, 5.27 MB, with H.264 picture and 48 kHz stereo AAC audio. A complete decode passed, and both new preset shots were inspected from the encoded file. Matching SHA-256 hashes of the audio streams confirm that the final export contains the exact approved warm soundtrack.

Outputs and generated audio are ignored in Git; all screenshot assets, fixtures, source, and reproduction instructions are versioned.

API references: [Remotion rendering](https://www.remotion.dev/docs/renderer/render-media), [bundler](https://www.remotion.dev/docs/bundler), and [still-frame checks](https://www.remotion.dev/docs/renderer/render-still).
