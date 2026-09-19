# Video soundtrack and credits

The soundtrack approved on September 19, 2026 uses **Eyesplit** by **Shane Ivers** (2016), a 154 BPM metal instrumental. It replaces the earlier synthesized experiment.

- Track and download: https://www.silvermansound.com/free-music/eyesplit
- Artist-provided MP3: https://www.silvermansound.com/wp-content/uploads/eyesplit.mp3
- License: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)
- Source SHA-256: `1c6215115f86d0211e09dc0144e259080cd954ed547310733f8ecef2c495a7af`

The film uses the first 30 seconds, a short attack fade, a 1.5-second ending fade, and two-pass loudness normalization targeting −16 LUFS. The original 30-second scene timing is preserved. It uses 48 kHz stereo AAC and fast-start MP4 metadata.

## Reproduce

Normal Remotion renders use the committed `public/eyesplit.m4a` excerpt and need no music download. To rebuild that audio, download the artist-provided MP3 to `video/out/music-source/eyesplit.mp3`, then run from the repository root:

```sh
node video/scripts/soundtrack-recorded.mjs
```

The script verifies the source hash and writes `video/public/eyesplit.m4a`. An alternate local source location can be passed as the first argument. The full source recording is an ignored working artifact. `npm run audio --prefix video` runs the same command. The subsequent video render runs the complete export verifier.

## Credit for publication

Include this alongside any published preview or final cut using this recording, including in the GitHub README and an X post. The credit is also embedded in the MP4 metadata, but metadata alone is not the intended public attribution.

Music: [Eyesplit by Shane Ivers](https://www.silvermansound.com/free-music/eyesplit), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Edited to 30 seconds, normalized, and faded for SlayDown.

The user’s Slayer reference videos are creative references; their audio is not sampled in this edit.
