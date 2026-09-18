import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output=path.join(root,'out');
await mkdir(output,{recursive:true});
const browserExecutable=process.env.REMOTION_BROWSER || (process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined);
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.tsx'),publicDir:path.join(root,'public'),outDir:path.join(root,'.cache/bundle')});
const composition=await selectComposition({serveUrl,id:'Folio',browserExecutable});
if(process.argv.includes('--stills')) {
  const selectedFrames=process.env.FOLIO_FRAMES?.split(',').map(Number) || [24,96,210,342,414,480,558,612,678,724,783,852,918,999,1140];
  for(const frame of selectedFrames) {
    await renderStill({serveUrl,composition,browserExecutable,frame,output:path.join(output,`frame-${frame}.png`),scale:.75});
    console.log(`Rendered frame ${frame}`);
  }
} else {
  let last=-1;
  await renderMedia({serveUrl,composition,browserExecutable,codec:'h264',audioCodec:'aac',crf:18,pixelFormat:'yuv420p',concurrency:4,outputLocation:path.join(output,'Folio-Plain-Text-Beautifully-Read.mp4'),onProgress:({progress})=>{const percent=Math.floor(progress*100/10)*10;if(percent!==last){last=percent;console.log(`Render ${percent}%`);}}});
  console.log(path.join(output,'Folio-Plain-Text-Beautifully-Read.mp4'));
}
