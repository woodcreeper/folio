import { chromium } from '../../node_modules/@playwright/test/index.mjs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public/screenshots');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' });
await page.goto(process.env.FOLIO_URL || 'http://127.0.0.1:1420');
await page.locator('#file-input').setInputFiles(path.join(root, 'public/Field notes.md'));
await page.locator('#reader h1').waitFor();

async function capture(name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, `${name}.png`), animations: 'disabled' });
  console.log(`Captured ${name}`);
}
async function settings(open) {
  if (await page.locator('#settings').isVisible() !== open) await page.getByRole('button', { name: 'Appearance settings' }).click();
}
async function top() {
  await page.locator('#reading-scroll').evaluate(el => el.scrollTo({ top: 0, behavior: 'instant' }));
}

await settings(true);
await page.getByRole('button', { name: 'Light', exact: true }).click();
await settings(false);
await capture('folio');
await page.getByRole('button', { name: 'Source', exact: true }).click();
await capture('source');
await page.getByRole('button', { name: 'Source', exact: true }).click();

await page.getByRole('link', { name: 'Find a rhythm', exact: true }).click();
// Wait for the app's intentional smooth outline scroll to settle.
await page.waitForTimeout(700);
await capture('outline');
await page.getByRole('button', { name: 'Find in document', exact: true }).click();
await page.getByRole('searchbox', { name: 'Search document' }).fill('thought');
await page.getByRole('button', { name: 'Next match', exact: true }).click();
await page.waitForTimeout(700);
await capture('search');
await page.getByRole('button', { name: 'Close search' }).click();

for (const style of ['code', 'writer', 'github']) {
  await settings(true);
  await page.locator(`[data-reading-style-option="${style}"]`).click();
  await settings(false);
  await top();
  await capture(style);
}

await settings(true);
await page.locator('[data-reading-style-option="folio"]').click();
await top();
await capture('appearance-neutral');
await page.getByRole('button', { name: 'Purple tint', exact: true }).click();
await capture('appearance-purple');
await settings(false);
await capture('purple');
await settings(true);
await page.getByRole('button', { name: 'Blue tint', exact: true }).click();
await page.getByRole('button', { name: 'Dark', exact: true }).click();
await capture('appearance-dark');
await settings(false);
await capture('dark');
await browser.close();
