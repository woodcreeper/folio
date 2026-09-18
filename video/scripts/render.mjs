import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output=path.join(root,'out');
await mkdir(output,{recursive:true});
const browserExecutable=process.env.REMOTION_BROWSER || (process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined);
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.tsx'),publicDir:path.join(root,'public'),outDir:path.join(root,'.cache/bundle')});
const composition=await selectComposition({serveUrl,id:'Folio',browserExecutable});
if(process.argv.includes('--poster')) {
  await renderStill({serveUrl,composition,browserExecutable,frame:0,output:path.join(output,'Folio-Cover.png')});
  console.log(path.join(output,'Folio-Cover.png'));
} else if(process.argv.includes('--stills')) {
  const selectedFrames=process.env.FOLIO_FRAMES?.split(',').map(Number) || [0,35,41,60,105,192,231,300,435,508,600,690,734,779,824,870,936,1005,1190];
  for(const frame of selectedFrames) {
    await renderStill({serveUrl,composition,browserExecutable,frame,output:path.join(output,`frame-${frame}.png`),scale:.75});
    console.log(`Rendered frame ${frame}`);
  }
} else {
  let last=-1;
  const approvedAudio=process.env.FOLIO_AUDIO_FROM;
  const picture=path.join(output,'Folio-picture-pass.mp4');
  const final=path.join(output,'Folio-Final.mp4');
  if(approvedAudio && path.resolve(approvedAudio)===final) throw new Error('Preserve approved audio in a separate input file before rendering.');
  await renderMedia({serveUrl,composition,browserExecutable,codec:'h264',audioCodec:'aac',crf:18,pixelFormat:'yuv420p',concurrency:4,outputLocation:picture,onProgress:({progress})=>{const percent=Math.floor(progress*100/10)*10;if(percent!==last){last=percent;console.log(`Render ${percent}%`);}}});
  execFileSync(process.env.FFMPEG || 'ffmpeg',['-y','-v','error','-i',picture,...(approvedAudio?['-i',approvedAudio]:[]),'-map','0:v:0','-map',approvedAudio?'1:a:0':'0:a:0','-c','copy','-movflags','+faststart',final],{stdio:'inherit'});
  console.log(path.join(output,'Folio-Final.mp4'));
}
