import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {mkdir, rename, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output=path.join(root,'out');
const timeline=JSON.parse(await readFile(path.join(root,'src/timeline.json'),'utf8'));
await mkdir(output,{recursive:true});
const browserExecutable=process.env.REMOTION_BROWSER || (process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined);
// The previous parallel JPEG capture produced isolated tiled frames on this Mac.
// Use lossless captures and one software-rendered page for predictable exports.
const chromiumOptions={gl:'swangle'};
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.tsx'),publicDir:path.join(root,'public'),outDir:path.join(root,'.cache/bundle')});
const inputProps={brandFont:'data:font/ttf;base64,'+(await readFile(path.resolve(root,'../src/assets/fonts/MetalMania-Regular.ttf'))).toString('base64')};
const composition=await selectComposition({serveUrl,id:'SlayDown',browserExecutable,chromiumOptions,inputProps});
if(process.argv.includes('--poster')) {
  await renderStill({serveUrl,composition,browserExecutable,chromiumOptions,inputProps,frame:0,output:path.join(output,'SlayDown-Cover.png')});
  console.log(path.join(output,'SlayDown-Cover.png'));
} else if(process.argv.includes('--stills')) {
  const selectedFrames=(process.env.SLAYDOWN_FRAMES || process.env.FOLIO_FRAMES)?.split(',').map(Number) || timeline.reviewFrames;
  for(const frame of selectedFrames) {
    await renderStill({serveUrl,composition,browserExecutable,chromiumOptions,inputProps,frame,output:path.join(output,`frame-${frame}.png`),scale:.75});
    console.log(`Rendered frame ${frame}`);
  }
} else {
  let last=-1;
  const approvedAudio=(process.env.SLAYDOWN_AUDIO_FROM || process.env.FOLIO_AUDIO_FROM);
  const picture=path.join(output,'SlayDown-picture-pass.mp4');
  const candidate=path.join(output,'SlayDown-candidate.mp4');
  const final=path.join(output,'SlayDown-Final.mp4');
  if(approvedAudio && [picture,candidate,final].includes(path.resolve(approvedAudio))) throw new Error('Preserve approved audio in a separate input file before rendering.');
  await renderMedia({serveUrl,composition,browserExecutable,chromiumOptions,inputProps,imageFormat:'png',codec:'h264',audioCodec:'aac',crf:18,pixelFormat:'yuv420p',concurrency:1,outputLocation:picture,onProgress:({progress})=>{const percent=Math.floor(progress*100/10)*10;if(percent!==last){last=percent;console.log(`Render ${percent}%`);}}});
  execFileSync(process.env.FFMPEG || 'ffmpeg',['-y','-v','error','-i',picture,...(approvedAudio?['-i',approvedAudio]:[]),'-map','0:v:0','-map',approvedAudio?'1:a:0':'0:a:0','-c','copy','-movflags','+faststart',candidate],{stdio:'inherit'});
  execFileSync(process.execPath,[path.join(root,'scripts/verify.mjs'),candidate],{stdio:'inherit'});
  await rename(candidate,final);
  console.log(path.join(output,'SlayDown-Final.mp4'));
}
