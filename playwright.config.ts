import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', use: { baseURL: 'http://127.0.0.1:1420', channel: 'chrome', viewport: { width: 1280, height: 900 } }, reporter: 'list' });
