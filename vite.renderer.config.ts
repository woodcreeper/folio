import { defineConfig } from 'vite';
export default defineConfig({ build: { outDir: 'dist-renderer', target: 'es2021', lib: { entry: 'src/renderer.ts', name: 'FolioRenderer', formats: ['iife'], fileName: () => 'renderer.js' } } });
