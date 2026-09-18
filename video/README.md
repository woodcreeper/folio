# Folio product film

A 30-second, 1080p Remotion film about the reason Folio exists: your AI agent creates Markdown files, and you want to read them quickly. The [script and storyboard](SCRIPT.md) follow Finder selection → Space-bar Quick Look → double-click into Folio → edit in your own app → automatic refresh.

The film uses real Mac screenshots captured on September 18, 2026, an original warm 120 BPM instrumental score with a relaxed half-time groove, and on-screen copy. There is no narration.

## Reproduce the film

The screenshots are committed. No running Folio or iA Writer instance is required to render:

```sh
cd video
npm ci
npm run audio
npm run poster
npm run stills
npm run render
npm run verify
```

Rendering uses installed Google Chrome on Mac; set `REMOTION_BROWSER` to another Chromium executable if needed. Python 3 generates the score. FFmpeg and FFprobe must be on PATH, or set `FFMPEG` and `FFPROBE`. Typography uses local Iowan Old Style/Baskerville with Georgia fallback; reproduce on Mac for matching type.

The renderer uses lossless PNG frames, one rendering page, and software `swangle` rendering. It scans the candidate MP4 before replacing `out/Folio-Final.mp4`; a failed check leaves the previous final in place. `npm run verify -- out/another-export.mp4` checks an export independently.

- `src/FolioFilm.tsx`: scenes, captions, crops, and animation.
- `src/timeline.json`: the shared 900-frame timeline, review frames, and static intervals checked by the verifier.
- `public/Agent workspace/`: public demo documents.
- `public/screenshots/workflow-*.png`: native Finder, Quick Look, Folio, and iA Writer captures.
- `scripts/soundtrack.py`: deterministic soft keys, rounded bass, and brushed percussion; no external samples. This cut keeps the approved sound and removes three repeated four-second phrases, with the same F → G → C ending.
- `scripts/verify.mjs`: verifies duration, decodes audio and every video frame, checks for blank frames and short corruption bursts, and compares deliberately static intervals. Visual review remains necessary.
- `out/Folio-Final.mp4`: H.264/AAC export.
- `out/Folio-Cover.png`: fully visible frame-zero splash, also used at `docs/images/folio-video-poster.png`.

`npm run capture` is the legacy browser capture workflow; it requires the root app’s dependencies and development server, and does not replace the native `workflow-*` captures. Generated audio and exports are ignored in Git.

`FOLIO_AUDIO_FROM` can preserve encoded audio from a separate approved MP4 of the **same duration**. Do not use the previous 42-second film as its input for this 30-second cut: the verification step rejects mismatched stream lengths.

## What changed in this cut

The film is 12 seconds shorter while showing more of the real workflow. Quick Look, app-opening, and end-card holds are tighter. Clean scene cuts keep old captions and settings from lingering over the next instruction.

Appearance stays in its own section: VS Code with blue tint → iA Writer with rose tint → iA Writer with amber tint. All Folio captures share the same window dimensions. The editing section starts with Appearance closed and directs attention to **Open in Editor**. In iA Writer, the heading changes from “A little room to read” to “A plan worth sharing.” After saving, Folio shows the new heading in both the document and outline.

## Native capture record

Only the prepared public PLAN.md is shown. The editor was opened through Folio’s actual Open in Editor button. Screenshots record the original heading, selection, three intermediate typing states (including macOS’s inline completion), and completed heading. Saving in iA Writer updated Folio’s heading and outline automatically; no Reload action or document reopen was used. The app was brought forward afterward to capture the already-updated document.

The original demo text was restored after filming and verified against Git. Temporary reader preferences were restored. Native Folio screenshots crop the OS title strip; editor screenshots crop to the Markdown text so the heading change stays readable. The source and content of the product UI are not composited or rewritten.

A capture setup issue exposed a macOS interaction: a file-specific Finder “Open With” override combined with quarantine metadata added by iA Writer caused a “PLAN.md Not Opened” warning. The public demo exactly matched its committed contents. Removing only that filming-specific association restored the editor handoff; quarantine metadata and system security settings were left intact. [Apple documents the same behavior for plain text files](https://developer.apple.com/forums/thread/795994). For future capture, avoid assigning a default to this individual demo file; use the user’s existing Markdown association, or demonstrate a one-time Open With choice.

Pointer/key illustrations, crops, cuts, and timing are added in Remotion. This is an edited screenshot demonstration, not a continuous recording or a launch-speed measurement. Space-bar preview is labeled as a Mac feature; Windows and Linux support refers to the desktop reader. The user separately confirmed Folio on Omarchy. No built-in editor is implied.

## Export review

The verified export contains exactly 900 frames at 1920 × 1080, 30 fps, and 30 seconds, with `yuv420p` H.264 picture and 48 kHz stereo AAC audio. The file is 2.42 MB; AAC packet padding brings container duration to 30.059 seconds. MP4 metadata precedes picture data for fast start. Full audio/video decoding and the scan of all 900 frames passed. Decoded storyboards, frames on both sides of every appearance/edit/save/refresh cut, and full-resolution handoff and refreshed-reader frames were visually reviewed. Audio measured −24.9 dBFS mean and −10.9 dBFS peak, with no clipping.

Review the actual MP4, including the style-to-editor boundary and each edit/save/refresh stage. The regression scanner was introduced after an earlier parallel JPEG render produced isolated tiled frames and one blank frame that normal codec checks missed. Serial PNG rendering and all-frame scanning remain enabled for this revision.

## GitHub and X

The README shows the splash image above an expandable inline GitHub attachment player. GitHub strips custom video poster attributes and can turn video-linked images into players, so keep the poster and attachment separate.

Upload `out/Folio-Final.mp4` directly to X as a video attachment. The landscape layout is 16:9, 1920 × 1080, 30 fps, H.264 High Profile with AAC-LC stereo audio and fast-start metadata. See [X’s upload limits](https://help.x.com/en/using-x/x-videos) and [encoding guidance](https://docs.x.com/x-api/media/quickstart/best-practices). X may transcode the upload. The cover is available for publishing flows that accept a custom thumbnail; it is also baked into the first frame. These scripts do not post to X.
