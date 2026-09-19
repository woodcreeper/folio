import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const font = await readFile(new URL('../../src/assets/fonts/MetalMania-Regular.ttf', import.meta.url));
const cache = new URL('../.cache/', import.meta.url);
await mkdir(cache, {recursive:true});
await writeFile(new URL('studio-props.json', cache), JSON.stringify({brandFont:'data:font/ttf;base64,' + font.toString('base64')}));
console.log(`Prepared studio font: ${fileURLToPath(cache)}`);
