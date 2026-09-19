# SlayDown product film

A 30-second, 1080p Remotion walkthrough: your AI agent creates Markdown → select a file in Finder → press Space → double-click into SlayDown → edit in your own app → see the saved change. The [script and storyboard](SCRIPT.md) describe every shot. Production notes live here; the main README presents the finished demo.

The SlayDown cut uses the bundled Metal Mania wordmark and an original 120 BPM metal instrumental: stereo power-chord guitars, palm-muted riffs, bass, and drums. The score uses plucked-string synthesis, contains no outside samples or recordings, and resolves on a sustained E5 chord. There is no narration.

## Reproduce

```sh
cd video
npm ci
npm run audio
npm run poster
npm run stills
npm run render
npm run verify
npm run social
```

The screenshots are committed, so rendering needs no running SlayDown or editor instance. Rendering uses installed Google Chrome on Mac; set `REMOTION_BROWSER` to another Chromium executable if needed. Python 3 generates the score using only its standard library. FFmpeg and FFprobe must be on PATH, or set `FFMPEG` and `FFPROBE`. Metal Mania is loaded from the bundled font. Other titles use local Iowan Old Style/Baskerville with Georgia fallback; render on Mac for matching typography.

- `src/SlayDownFilm.tsx`: scenes, copy, crops, and animation.
- `src/timeline.json`: the shared 900-frame timeline, review frames, and static intervals.
- `public/Agent workspace/`: public demo documents.
- `public/screenshots/slaydown-*.png`: the walkthrough captures.
- `scripts/soundtrack.py`: reproducible original metal score.
- `scripts/soundtrack-warm.py`: the previous warm score, retained as an optional alternative.
- `out/SlayDown-Final.mp4`: H.264/AAC export.
- `out/SlayDown-Cover.png`: fully visible frame-zero splash.
- `src/SlayDownSocial.tsx`: the 1280 × 640 social card.

Generated audio and working exports are ignored. The approved distribution MP4 belongs in `docs/media/SlayDownDemo.mp4`, with its cover in `docs/images/slaydown-video-poster.png`. Replace those files only after reviewing the rendered candidate.

`SLAYDOWN_FRAMES=0,490,759 npm run stills` selects specific review frames. `SLAYDOWN_AUDIO_FROM=/absolute/path/approved.mp4 npm run render` preserves encoded audio from a separate approved MP4 of the **same duration**. The old `FOLIO_FRAMES` and `FOLIO_AUDIO_FROM` names remain accepted. Do not reuse the old 42-second film’s audio in this 30-second cut.

## Story and capture

Appearance has its own section: VS Code with blue tint → iA Writer with rose tint → Omarchy with amber tint. The editing section begins with Appearance closed and directs attention to **Open in Editor**. The external editor changes “A little room to read” to “A plan worth sharing.” The refreshed reader shows the new heading in both the document and outline.

Captured on September 18, 2026, using the installed SlayDown 0.2.0 app and iA Writer. All reader shots share a 1224 × 768 capture surface. Finder and Quick Look are native captures; the latter visibly offers **Open with SlayDown**. The editor was launched through SlayDown. Saving the changed heading updated the document and outline without a reload or reopen. The demo heading and appearance preferences were restored afterward.

Only the public PLAN.md is used. Preserve the demo’s original heading after capturing, and restore temporary reader preferences. Do not set a file-specific Finder association on the demo: an earlier capture exposed a macOS interaction between that override and quarantine metadata. [Apple documents the behavior for plain text](https://developer.apple.com/forums/thread/795994). Leave quarantine and system security settings intact.

Pointer/key illustrations, crops, cuts, and timing are added in Remotion. This is an edited screenshot demonstration, not a continuous recording or a launch-speed measurement. Space-bar preview is labeled as a Mac feature; Windows and Linux refer to the desktop reader. The user separately confirmed the earlier Folio build on Omarchy. No built-in editor is implied.

The `workflow-*` screenshots and old `FolioSocial.tsx` remain historical source assets. `npm run capture` is the legacy browser capture utility; it does not replace the native walkthrough captures.

## Export verification

The renderer uses lossless PNG frames, a single rendering page, and software `swangle` rendering. It verifies a candidate before replacing the final MP4; a failed check preserves the previous final.

`npm run verify -- out/another-export.mp4` checks another export. The verifier decodes the complete audio/video, requires 900 frames and 30-second streams, scans for blank frames and short corruption bursts, and compares deliberately static intervals. It was introduced after a parallel JPEG render produced tiled and blank frames despite valid codecs. These checks do not replace watching the actual MP4 and inspecting both sides of each appearance, editor, save, and refresh cut.

The September 18 SlayDown export passed the complete 900-frame scan and audio/video decoding. It is 1920 × 1080, 30 fps, H.264 High Profile / `yuv420p`, with 48 kHz stereo AAC-LC. Picture duration is 30 seconds; AAC padding brings the container to 30.059 seconds. The file is 2.34 MB. Encoded audio measures −20.0 dBFS mean and −6.9 dBFS peak. Both sides of the appearance/editor/save/refresh cuts were inspected from the encoded MP4.

## GitHub and X

Use the finished demo and its cover on the public README, without production instructions beside it. For an inline GitHub attachment player, upload the MP4 in GitHub’s Markdown editor and use the resulting attachment URL. A cover linking to the committed MP4 also works without an attachment upload.

Upload `out/SlayDown-Final.mp4` directly to X. It is 16:9, 1920 × 1080, 30 fps, H.264 with `yuv420p`, stereo AAC, and fast-start metadata. The first frame is a complete cover; a separate PNG is available for flows that accept a thumbnail. X may transcode the upload. These scripts do not publish posts.

`npm run social` writes `docs/images/slaydown-social.png`, an opaque 1280 × 640 PNG under 1 MB. Upload it under repository **Settings → General → Social preview**; committing the image alone does not update GitHub’s link preview. It also works as a standalone image attachment. The repository remains `woodcreeper/folio`, so existing links continue to work.

Current GitHub attachment: https://github.com/user-attachments/assets/b025dee5-04a4-4a88-9c04-39b0a81a428e

Distribution MP4 SHA-256: `cd575c207aec8b8a357c228ba887399a2f521f3add1de7524db2acc5aa11221f`.
