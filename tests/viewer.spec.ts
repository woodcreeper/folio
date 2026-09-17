import { test, expect } from '@playwright/test';

const document = '# Project notes\n\nA beautiful **Markdown** document.\n\n## Details\n\n- [x] Finished task\n\n| Feature | State |\n| --- | --- |\n| Viewer | Ready |\n\n```js\nconst answer = 42;\n```\n\n[Details](#details)\n\n![Remote](https://example.com/remote.png)\n\n<script>window.compromised = true</script>';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('renders sample, outline, source and accessible search', async ({ page }) => {
  await expect(page.locator('#reader h1')).toHaveText('A little room to read.');
  await expect(page.locator('#outline a')).toHaveCount(6);
  await page.getByRole('button', { name: 'Find in document', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search document' }).fill('Folio');
  await expect(page.locator('#search-count')).toHaveText('1 of 2');
  await page.getByRole('button', { name: 'Next match' }).click();
  await expect(page.locator('#search-count')).toHaveText('2 of 2');
  await page.keyboard.press('Escape');
  await expect(page.locator('.search-match')).toHaveCount(0);
  await page.getByRole('button', { name: 'Find in document', exact: true }).click();
  await expect(page.locator('.search-match')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Source', exact: true }).click();
  await expect(page.locator('#source-content')).toBeVisible();
  await expect(page.locator('#reader')).toBeHidden();
  await page.getByRole('link', { name: 'A lighter kind of workspace' }).click();
  await expect(page.locator('#reader')).toBeVisible();
});

test('opens real files, retains source safely, and avoids remote requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => { if (request.url().includes('example.com')) requests.push(request.url()); });
  await page.locator('#file-input').setInputFiles({ name: 'notes.md', mimeType: 'text/markdown', buffer: Buffer.from(document) });
  await expect(page.locator('#filename')).toHaveText('notes.md');
  await expect(page.locator('#reader h1')).toHaveText('Project notes');
  await expect(page.locator('#reader table')).toBeVisible();
  await expect(page.locator('#reader input[type="checkbox"]')).toBeChecked();
  await expect(page.locator('#reader input[type="checkbox"]')).toBeDisabled();
  await expect(page.locator('#reader script')).toHaveCount(0);
  await expect(page.locator('#reader')).toContainText('<script>window.compromised = true</script>');
  await expect(page.locator('#reader img')).toHaveCount(0);
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).compromised)).toBeUndefined();
  await page.getByRole('button', { name: 'Source', exact: true }).click();
  await expect(page.locator('#source-content')).toHaveText(document);
});

test('changes appearance and size without losing document', async ({ page }) => {
  await page.getByRole('button', { name: 'Appearance settings' }).click();
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Increase reading size' }).click();
  await expect(page.locator('#font-size')).toHaveText('18');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#font-size')).toHaveText('18');
});

test('rejects non-Markdown and invalid UTF-8 files and keeps current document', async ({ page }) => {
  await page.locator('#file-input').setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('bad') });
  await expect(page.locator('#toast')).toContainText('Choose a Markdown file');
  await page.locator('#file-input').setInputFiles({ name: 'bad.md', mimeType: 'text/markdown', buffer: Buffer.from([0xff,0xfe]) });
  await expect(page.locator('#toast')).toBeVisible();
  await expect(page.locator('#reader h1')).toHaveText('A little room to read.');
});

test('fits a narrow viewport without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 700 });
  await expect(page.locator('#reader h1')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect(page.locator('.sidebar')).toBeHidden();
});

test('reading styles change presentation, retain source and persist independently of theme and size', async ({ page }) => {
  await page.getByRole('button', { name: 'Appearance settings' }).click();
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await page.getByRole('button', { name: 'Increase reading size' }).click();
  const original = await page.locator('#reader').innerText();
  const fonts: string[] = [];
  for (const [id, name] of [['code','VS Code'],['writer','iA Writer'],['github','GitHub'],['folio','Folio']]) {
    await page.locator(`[data-reading-style-option="${id}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('data-reading-style', id);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.locator('#reader').innerText()).toBe(original);
    expect(await page.locator('#reader').evaluate(el => getComputedStyle(el).fontSize)).toBe('18px');
    fonts.push(await page.locator('#reader h1').evaluate(el => getComputedStyle(el).fontFamily));
  }
  expect(new Set(fonts).size).toBeGreaterThan(1);
  await page.locator('[data-reading-style-option="writer"]').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-reading-style', 'writer');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#font-size')).toHaveText('18');
});
