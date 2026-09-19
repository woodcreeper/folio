import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '../docs/images/slaydown-social.png');
const browserExecutable = process.env.REMOTION_BROWSER || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
const chromiumOptions = {gl:'swangle'};
const serveUrl = await bundle({entryPoint:path.join(root,'src/SlayDownSocial.tsx'), publicDir:path.join(root,'public'), outDir:path.join(root,'.cache/social')});
const composition = await selectComposition({serveUrl, id:'SlayDownSocial', browserExecutable, chromiumOptions});
await mkdir(path.dirname(output), {recursive:true});
await renderStill({serveUrl, composition, browserExecutable, chromiumOptions, frame:0, output});
if ((await stat(output)).size >= 1_000_000) throw new Error('GitHub social previews must be under 1 MB.');
console.log(output);
