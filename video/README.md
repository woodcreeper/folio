# Folio product film

40-second, 1080p Remotion video built from screenshots of the real Folio frontend. The [script and storyboard](SCRIPT.md) include an optional voiceover; the exported film uses on-screen copy and an original instrumental bed.

The initial screenshots were captured from the app at commit `112ad5d` using the included demonstration document. The film shows source preview, the rendered page, outline navigation, a real search match, all four reading presets, and the tint controls in light and dark mode.

## Reproduce

From the repository root, install the app’s dependencies and run `npm run dev` for screenshot capture. Then, in another terminal:

```sh
cd video
npm ci
npm run capture
npm run audio
npm run stills
npm run render
```

Capture uses the root project’s Playwright dependency and local Google Chrome. Rendering uses installed Google Chrome on Mac; set `REMOTION_BROWSER` to an alternate Chromium executable if needed. Python 3 generates the original audio. Typography uses local Iowan Old Style/Baskerville with Georgia fallback; screenshots are captured at 2× resolution. Reproduce on Mac for matching typography.

- `public/screenshots/`: original Folio screen captures.
- `public/Field notes.md`: non-private demonstration document.
- `src/FolioFilm.tsx`: editable scenes, text, crops, timing, and transitions.
- `scripts/soundtrack.py`: original synthesized score, with no external audio samples.
- `out/Folio-Plain-Text-Beautifully-Read.mp4`: rendered H.264/AAC film.

No Folio application dependencies or runtime code were changed for the film. Rendering is separate from the app build. Video outputs and generated audio are ignored in Git; screenshots and source are kept for reproducibility.

## Export verification

The initial export contains 1,200 H.264 frames at 1920 × 1080 and 30 fps, plus 48 kHz stereo AAC audio. Duration is 40 seconds (the AAC container tail adds approximately 43 ms); file size is 9.35 MB. TypeScript validation passes. Storyboard frames and frames decoded from the completed MP4 were visually inspected; a complete decode reported no errors.

API references: [Remotion rendering](https://www.remotion.dev/docs/renderer/render-media), [bundler](https://www.remotion.dev/docs/bundler), and [still-frame checks](https://www.remotion.dev/docs/renderer/render-still).
