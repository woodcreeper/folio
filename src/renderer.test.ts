import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './renderer';

describe('renderMarkdown', () => {
  it('renders common Markdown, tables, strikethrough, footnotes and disabled task lists', () => {
    const { html } = renderMarkdown(`# A reader\n\n**Bold** and ~~removed~~.\n\n| Left | Right |\n| :--- | ---: |\n| One | Two |\n\n- [ ] Read this\n- [x] Finished\n  - [X] Nested\n\nA note.[^1]\n\n[^1]: A useful footnote.`);
    expect(html).toContain('<h1 id="folio-a-reader">A reader</h1>');
    expect(html).toContain('<strong>Bold</strong>');
    expect(html).toContain('<s>removed</s>');
    expect(html).toContain('<table>');
    expect(html).toContain('text-align:right');
    expect(html.match(/type="checkbox" disabled/g)).toHaveLength(3);
    expect(html.match(/disabled checked/g)).toHaveLength(2);
    expect(html).toContain('A useful footnote.');
    expect(html).toContain('href="#fnfolio-note-1"');
    expect(html).toContain('id="fnfolio-note-1"');
  });

  it('preserves readable headings and generates unique anchors, including non-Latin text', () => {
    const source = '# Hello *reader*\n\n## Hello reader\n\n## Hello reader-2\n\n## 東京の旅\n\n## !!!\n\n[Jump](#hello-reader)';
    const first = renderMarkdown(source);
    expect(first.headings).toEqual([
      { id: 'folio-hello-reader', text: 'Hello reader', level: 1 },
      { id: 'folio-hello-reader-2', text: 'Hello reader', level: 2 },
      { id: 'folio-hello-reader-2-2', text: 'Hello reader-2', level: 2 },
      { id: 'folio-東京の旅', text: '東京の旅', level: 2 },
      { id: 'folio-section', text: '!!!', level: 2 },
    ]);
    expect(first.html).toContain('href="#folio-hello-reader"');
    expect(renderMarkdown(source)).toEqual(first);
  });

  it('highlights supported languages and escapes unknown code and raw HTML', () => {
    const { html } = renderMarkdown('```js\nconst value = "hello";\n```\n\n```unknown\n<script>alert(1)</script>\n```\n\n<script>alert(2)</script>\n\n<img src=x onerror=alert(3)>');
    expect(html).toContain('hljs-keyword');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;script&gt;alert(2)&lt;/script&gt;');
    expect(html).not.toMatch(/<(script|img)\b/);
  });

  it('never emits active script, file, data or application links', () => {
    const { html } = renderMarkdown('[web](https://example.com?a=1&b=2) [email](mailto:hello@example.com) [local](./readme.md) [app](custom-app:launch) [file](file:///etc/passwd) [bad](javascript:alert%281%29) [bad2](data:text/html,test)');
    expect(html).toContain('href="https://example.com?a=1&amp;b=2"');
    expect(html).toContain('href="mailto:hello@example.com"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('Local file links are not available yet.');
    expect(html).not.toMatch(/href="(?:javascript:|data:|file:|custom-app:|\.\/)/);
    expect(html.match(/<span\b/g)).toHaveLength(2);
    expect(html.match(/<\/span>/g)).toHaveLength(2);
  });

  it('keeps remote images inert and delegates only relative image paths to the host', () => {
    const { html } = renderMarkdown('![A remote image](https://example.com/tracker.png)\n\n![Local <image>](./assets/photo.png)\n\n![Network](//example.com/a.png)\n\n![Absolute](/private/secret.png)\n\n![SVG](data:image/svg+xml;base64,PHN2Zz4=)');
    expect(html).not.toMatch(/<img\b/);
    expect(html).toContain('Remote image · A remote image');
    expect(html).toContain('Remote image · Network');
    expect(html).toContain('data-image-path="./assets/photo.png"');
    expect(html).toContain('aria-label="Local &lt;image&gt;"');
    expect(html).not.toContain('data-image-path="/private/');
    expect(html).not.toContain('data-image-path="data:');
  });

  it('escapes image attributes, heading attributes, and code language labels', () => {
    const { html } = renderMarkdown('# Title " onmouseover="alert(1)\n\n![" onerror="alert(1)](./photo.png)\n\n```x"onclick="alert(1)\nSafe\n```');
    expect(html).not.toMatch(/\s(?:onerror|onclick|onmouseover)="/);
    expect(html).toContain('&quot; onerror=&quot;alert(1)');
  });

  it('counts visible text without Markdown syntax or link destinations', () => {
    const result = renderMarkdown('# Two words\n\n[Another word](https://example.com/long/path) **and one**.\n\n- [x] Done');
    expect(result.wordCount).toBe(7);
    expect(result.readingMinutes).toBe(1);
    expect(renderMarkdown('').wordCount).toBe(0);
    expect(renderMarkdown('').readingMinutes).toBe(0);
    expect(renderMarkdown('word '.repeat(441)).readingMinutes).toBe(3);
    expect(renderMarkdown('你好世界').wordCount).toBe(4);
  });

  it('does not turn task-like prose or subsequent list paragraphs into checkboxes', () => {
    const { html } = renderMarkdown('[x] Just prose\n\n- Ordinary item\n\n  [x] Second paragraph\n\n- > [x] Quoted marker\n\n- ```js\n  x\n  ```\n\n  [x] After code\n\n- [ ] A real task');
    expect(html.match(/type="checkbox"/g)).toHaveLength(1);
    expect(html).toContain('[x] Just prose');
    expect(html).toContain('[x] Second paragraph');
    expect(html).toContain('[x] Quoted marker');
    expect(html).toContain('[x] After code');
  });
});
