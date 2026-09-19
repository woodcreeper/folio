import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdir, stat, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '../docs/images/slaydown-social.png');
const browserExecutable = process.env.REMOTION_BROWSER || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
const chromiumOptions = {gl:'swangle'};
const serveUrl = await bundle({entryPoint:path.join(root,'src/SlayDownSocial.tsx'), publicDir:path.join(root,'public'), outDir:path.join(root,'.cache/social')});
const inputProps = {brandFont: 'data:font/ttf;base64,' + (await readFile(path.resolve(root, '../src/assets/fonts/MetalMania-Regular.ttf'))).toString('base64')};
const composition = await selectComposition({serveUrl, id:'SlayDownSocial', browserExecutable, chromiumOptions, inputProps});
await mkdir(path.dirname(output), {recursive:true});
await renderStill({serveUrl, composition, browserExecutable, chromiumOptions, inputProps, frame:0, output});
if ((await stat(output)).size >= 1_000_000) throw new Error('GitHub social previews must be under 1 MB.');
console.log(output);
