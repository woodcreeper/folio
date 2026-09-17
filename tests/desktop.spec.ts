import { test, expect, type Page } from '@playwright/test';

const longDocument = '# Reading notes\n\n' + Array.from({ length: 35 }, (_, i) => `## Section ${i + 1}\n\nParagraph ${i + 1}. Words to read, with a clear place to return to after a save.\n\n`).join('');

async function mockDesktop(page: Page) {
  await page.addInitScript(({ content }) => {
    const host = window as any;
    const callbacks = new Map<number, Function>();
    const listeners = new Map<string, number[]>();
    let callbackID = 0;
    host.testHost = {
      doc: { name: 'notes.md', path: '/documents/notes.md', content },
      editor: null,
      cancelPicker: false,
      reloadFailures: 0,
      reloadDelay: 0,
      imageDelay: 0,
      calls: [],
      emit(event: string, payload: unknown) {
        for (const id of listeners.get(event) || []) callbacks.get(id)?.({ event, payload, id });
      },
    };
    host.__TAURI_INTERNALS__ = {
      metadata: { currentWebview: { label: 'main' }, currentWindow: { label: 'main' } },
      transformCallback(callback: Function) { callbacks.set(++callbackID, callback); return callbackID; },
      async invoke(command: string, args: any = {}) {
        host.testHost.calls.push({ command, args });
        if (command === 'plugin:event|listen') {
          listeners.set(args.event, [...(listeners.get(args.event) || []), args.handler]);
          return args.handler;
        }
        if (command === 'get_initial_document') return { ...host.testHost.doc };
        if (command === 'get_editor') return host.testHost.editor;
        if (command === 'choose_editor') {
          if (host.testHost.cancelPicker) return null;
          host.testHost.editor = { name: 'Test Editor', path: '/Applications/Test Editor.app' };
          return host.testHost.editor;
        }
        if (command === 'open_in_editor') return host.testHost.editor;
        if (command === 'watch_document') return null;
        if (command === 'reload_document') {
          const snapshot = { ...host.testHost.doc };
          if (host.testHost.reloadDelay) await new Promise(resolve => setTimeout(resolve, host.testHost.reloadDelay));
          if (host.testHost.reloadFailures > 0) { host.testHost.reloadFailures--; throw new Error('File temporarily unavailable'); }
          return snapshot;
        }
        if (command === 'read_image') {
          await new Promise(resolve => setTimeout(resolve, host.testHost.imageDelay));
          return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6SAAAAABJRU5ErkJggg==';
        }
        return null;
      },
    };
  }, { content: longDocument });
  await page.goto('/');
  await expect(page.locator('#filename')).toHaveText('notes.md');
  await expect(page.getByRole('button', { name: 'Open in Editor', exact: true })).toBeEnabled();
}

test('editor picker persists in host and opens the exact current file; cancel does not launch', async ({ page }) => {
  await mockDesktop(page);
  await page.evaluate(() => { (window as any).testHost.cancelPicker = true; });
  await page.getByRole('button', { name: 'Open in Editor', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).testHost.calls.filter((call: any) => call.command === 'choose_editor').length)).toBe(1);
  await expect(page.getByRole('button', { name: 'Open in Editor', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => (window as any).testHost.calls.filter((call: any) => call.command === 'open_in_editor'))).toHaveLength(0);
  await page.evaluate(() => { (window as any).testHost.cancelPicker = false; });
  await page.getByRole('button', { name: 'Open in Editor', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).testHost.calls.filter((call: any) => call.command === 'open_in_editor'))).toEqual([{ command: 'open_in_editor', args: { path: '/documents/notes.md' } }]);
  await page.getByRole('button', { name: 'Open in Editor', exact: true }).click();
  expect(await page.evaluate(() => (window as any).testHost.calls.filter((call: any) => call.command === 'choose_editor'))).toHaveLength(2);
  await page.getByRole('button', { name: 'Appearance settings' }).click();
  await expect(page.locator('#editor-name')).toHaveText('Test Editor');
});

test('saved changes refresh without moving the paragraph being read, including temporary missing file', async ({ page }) => {
  await mockDesktop(page);
  await page.locator('#folio-section-18').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  const before = await page.locator('#folio-section-18').evaluate(element => element.getBoundingClientRect().top);
  await page.evaluate(() => {
    const host = (window as any).testHost;
    host.reloadFailures = 1;
    host.doc.content = host.doc.content.replace('# Reading notes', '# Reading notes\n\n' + 'New introduction. '.repeat(120));
    host.emit('document-changed', host.doc.path);
  });
  await expect(page.locator('#reader')).toContainText('New introduction.');
  const after = await page.locator('#folio-section-18').evaluate(element => element.getBoundingClientRect().top);
  expect(Math.abs(after - before)).toBeLessThan(3);
  await expect(page.locator('#file-status')).toHaveText('Live preview');
});

test('a slow refresh never replaces a newly selected document', async ({ page }) => {
  await mockDesktop(page);
  await page.evaluate(() => {
    const host = (window as any).testHost;
    host.reloadDelay = 500;
    host.doc.content = '# Stale result';
    host.emit('document-changed', host.doc.path);
  });
  await expect.poll(() => page.evaluate(() => (window as any).testHost.calls.filter((call: any) => call.command === 'reload_document').length)).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Welcome to Folio md', exact: true }).click();
  // Wait for the controlled old response, not for an arbitrary production delay.
  await page.waitForTimeout(650);
  await expect(page.locator('#reader h1')).toHaveText('A little room to read.');
  await expect(page.locator('#file-status')).toHaveText('Sample document');
  await expect(page.getByRole('button', { name: 'Open in Editor', exact: true })).toBeDisabled();
});

test('manual reload keeps source mode and reading position', async ({ page }) => {
  await mockDesktop(page);
  await page.getByRole('button', { name: 'Source', exact: true }).click();
  await page.locator('#reading-scroll').evaluate(element => element.scrollTo({ top: 900, behavior: 'instant' }));
  await page.evaluate(() => { (window as any).testHost.doc.content += '\nSaved at the end.'; });
  await page.getByRole('button', { name: 'Reload from disk' }).click();
  await expect(page.locator('#source-content')).toContainText('Saved at the end.');
  await expect(page.locator('#source-content')).toBeVisible();
  expect(await page.locator('#reading-scroll').evaluate(element => element.scrollTop)).toBeGreaterThan(800);
});


test('late images do not undo an explicit outline navigation after refresh', async ({ page }) => {
  await mockDesktop(page);
  await page.locator('#folio-section-10').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.evaluate(() => {
    const host = (window as any).testHost;
    host.imageDelay = 650;
    host.doc.content = host.doc.content.replace('# Reading notes', '# Reading notes\n\n![A local image](image.png)');
    host.emit('document-changed', host.doc.path);
  });
  await expect(page.locator('[data-image-path]')).toHaveCount(1);
  await page.locator('#outline [data-heading="folio-section-25"]').click();
  await expect(page.locator('#reader img')).toHaveCount(1);
  await expect.poll(() => page.locator('#folio-section-25').evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(200);
  expect(await page.locator('#folio-section-10').evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(-500);
});
