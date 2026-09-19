// Rebuild the approved 30-second Eyesplit edit from the artist-provided recording.
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(process.argv[2] || path.join(root, 'out/music-source/eyesplit.mp3'));
const output = path.join(root, 'public/eyesplit.m4a');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const credit = 'Music: Eyesplit by Shane Ivers — https://www.silvermansound.com/free-music/eyesplit — CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ . Edited to 30 seconds, normalized and faded for SlayDown.';
mkdirSync(path.dirname(output), {recursive: true});
const sourceHash = createHash('sha256').update(readFileSync(source)).digest('hex');
if (sourceHash !== '1c6215115f86d0211e09dc0144e259080cd954ed547310733f8ecef2c495a7af') {
  throw new Error('Unexpected source recording. Verify its provenance before using the Eyesplit credit.');
}

// Trim before analysis so both loudness passes measure precisely the same edit.
const edit = 'atrim=start=0:end=30,asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st=28.5:d=1.5';
const analysis = spawnSync(ffmpeg, [
  '-hide_banner', '-nostats', '-i', source,
  '-af', `${edit},loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json`,
  '-f', 'null', '-',
], {encoding: 'utf8'});
if (analysis.error) throw analysis.error;
if (analysis.status !== 0) throw new Error(analysis.stderr);
const measured = JSON.parse(analysis.stderr.match(/\{[\s\S]*?\}/)?.[0] || '{}');
for (const key of ['input_i', 'input_tp', 'input_lra', 'input_thresh', 'target_offset']) {
  if (!Number.isFinite(Number(measured[key]))) throw new Error(`Invalid loudness measurement: ${key}`);
}
const normalize = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`;
execFileSync(ffmpeg, [
  '-y', '-v', 'error', '-i', source,
  '-map', '0:a:0', '-map_metadata', '-1', '-af', `${edit},${normalize}`,
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', '30',
  '-metadata', 'title=Eyesplit — SlayDown 30-second edit',
  '-metadata', `comment=${credit}`, '-movflags', '+faststart', output,
], {stdio: 'inherit'});
console.log(output);
