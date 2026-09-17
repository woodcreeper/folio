import { copyFileSync } from 'node:fs';
copyFileSync(new URL('../src/reader.css', import.meta.url), new URL('../dist-renderer/reader.css', import.meta.url));
