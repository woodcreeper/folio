import MarkdownIt, { type PluginSimple } from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import footnote from 'markdown-it-footnote';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import rust from 'highlight.js/lib/languages/rust';
import swift from 'highlight.js/lib/languages/swift';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';

/** Shared by the desktop reader and Quick Look's JavaScriptCore context. No DOM required. */
export interface RenderedMarkdown {
  html: string;
  headings: Array<{ id: string; text: string; level: number }>;
  wordCount: number;
  readingMinutes: number;
}

for (const [name, definition] of Object.entries({
  javascript, typescript, python, json, bash, css, xml, rust, swift, sql, yaml,
})) {
  hljs.registerLanguage(name, definition);
}

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
  breaks: false,
  highlight(source, language) {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(source, { language, ignoreIllegals: true }).value;
    }
    return ''; // markdown-it escapes code when no highlighter handles it.
  },
// The footnote package's DefinitelyTyped declaration still imports the CommonJS
// MarkdownIt type. Its runtime plugin contract is identical to the ESM version.
}).use(footnote as unknown as PluginSimple);

const escape = markdown.utils.escapeHtml;

function plainText(tokens: Token[]): string {
  return tokens.map((token) => {
    if (token.type === 'text' || token.type === 'code_inline') return token.content;
    if (token.type === 'softbreak' || token.type === 'hardbreak') return ' ';
    if (token.type === 'image') return plainText(token.children ?? []) || token.content;
    return '';
  }).join('');
}

function slug(text: string): string {
  return text.normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '')
    .trim().replace(/\s+/g, '-') || 'section';
}

function fragmentHref(href: string): string {
  let fragment = href.slice(1);
  try { fragment = decodeURIComponent(fragment); } catch { /* Keep malformed escapes inert. */ }
  return fragment.startsWith('folio-') ? `#${fragment}` : `#folio-${slug(fragment)}`;
}

function allowedLink(href: string): boolean {
  return href.startsWith('#') || /^(https?:\/\/|mailto:)/i.test(href);
}

// Convert unsupported links to plain spans. Links never invoke file: URLs, custom
// application protocols, or local paths; native hosts decide how to open allowed URLs.
markdown.core.ruler.push('folio-links-and-tasks', (state) => {
  const listStack: Token[] = [];
  for (const [index, token] of state.tokens.entries()) {
    if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') listStack.push(token);
    if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') listStack.pop();
    if (token.type !== 'inline' || !token.children) continue;

    // A task marker belongs only to a list item's first block when it is a
    // paragraph, not a quote, heading, or a paragraph after a code block.
    const item = state.tokens[index - 2];
    if (item?.type === 'list_item_open' && state.tokens[index - 1]?.type === 'paragraph_open') {
      const first = token.children[0];
      const match = first?.type === 'text' ? /^\[([ xX])\]\s+/.exec(first.content) : null;
      if (match) {
        first.content = first.content.slice(match[0].length);
        item.attrJoin('class', 'task-list-item');
        listStack[listStack.length - 1]?.attrJoin('class', 'contains-task-list');
        const checkbox = new state.Token('html_inline', '', 0);
        const checked = match[1].toLowerCase() === 'x';
        checkbox.content = `<input class="task-checkbox" type="checkbox" disabled${checked ? ' checked' : ''} aria-label="${checked ? 'Completed' : 'Incomplete'} task"> `;
        token.children.unshift(checkbox);
      }
    }

    const linkStack: boolean[] = [];
    for (const child of token.children) {
      if (child.type === 'link_open') {
        const href = child.attrGet('href') ?? '';
        const allowed = allowedLink(href);
        linkStack.push(allowed);
        if (allowed) {
          if (href.startsWith('#')) child.attrSet('href', fragmentHref(href));
          else child.attrSet('rel', 'noopener noreferrer');
        } else {
          child.tag = 'span';
          child.attrs = [
            ['class', 'unsupported-link'],
            ['title', 'Local file links are not available yet.'],
          ];
        }
      } else if (child.type === 'link_close' && linkStack.pop() === false) {
        child.tag = 'span';
      }
    }
  }
});

// Image bytes are exclusively resolved by the host after validating a document's
// directory and image type. Even remote and data URLs remain inert placeholder text.
markdown.renderer.rules.image = (tokens, index) => {
  const token = tokens[index];
  const path = token.attrGet('src') ?? '';
  const alt = plainText(token.children ?? []) || token.content || 'Image';
  const remote = /^(?:https?:)?\/\//i.test(path);
  const unsupported = /^[a-z][a-z\d+.-]*:/i.test(path) || /[\u0000-\u001f\u007f\\]/.test(path) || path.startsWith('/');
  if (remote || unsupported || !path) {
    return `<span class="image-placeholder" role="img" aria-label="${escape(alt)}">${remote ? 'Remote image' : 'Image unavailable'} · ${escape(alt)}</span>`;
  }
  return `<span class="local-image image-placeholder" data-image-path="${escape(path)}" role="img" aria-label="${escape(alt)}">Local image · ${escape(alt)}</span>`;
};

// Prefix footnote IDs as well, keeping generated anchors separate from page controls.
markdown.renderer.rules.footnote_anchor_name = (tokens, index) => `folio-note-${Number(tokens[index].meta.id) + 1}`;

export function renderMarkdown(source: string): RenderedMarkdown {
  const env = {};
  const tokens = markdown.parse(source, env);
  const headings: RenderedMarkdown['headings'] = [];
  const usedIds = new Set<string>();
  const textParts: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'heading_open') {
      const text = plainText(tokens[index + 1]?.children ?? []);
      const base = `folio-${slug(text)}`;
      let id = base;
      let suffix = 2;
      while (usedIds.has(id)) id = `${base}-${suffix++}`;
      usedIds.add(id);
      token.attrSet('id', id);
      headings.push({ id, text, level: Number(token.tag.slice(1)) });
    }
    if (token.type === 'inline') textParts.push(plainText(token.children ?? []));
    if (token.type === 'fence' || token.type === 'code_block') textParts.push(token.content);
  }

  // Approximate reading statistics from rendered text, excluding markup and URLs.
  // Count each Han character separately, since these languages do not require spaces.
  const text = textParts.join(' ');
  const hanCount = (text.match(/\p{Script=Han}/gu) ?? []).length;
  const words = text.replace(/\p{Script=Han}/gu, ' ').match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ?? [];
  const wordCount = words.length + hanCount;

  return {
    html: markdown.renderer.render(tokens, markdown.options, env),
    headings,
    wordCount,
    readingMinutes: wordCount ? Math.max(1, Math.ceil(wordCount / 220)) : 0,
  };
}
