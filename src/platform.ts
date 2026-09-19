export interface MarkdownDocument { name: string; path: string; content: string }
export const isDesktop = '__TAURI_INTERNALS__' in window;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const extensions = /\.(md|markdown|mdown|mkd)$/i;

export async function native<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

export async function documentFromFile(file: File): Promise<MarkdownDocument> {
  if (!extensions.test(file.name)) throw new Error('Choose a Markdown file (.md, .markdown, .mdown, or .mkd).');
  if (file.size > MAX_FILE_BYTES) throw new Error('This file is too large. Riffdown currently opens files up to 10 MB.');
  const content = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
  return { name: file.name, path: `browser:${file.name}:${file.lastModified}:${file.size}`, content };
}

export async function openLink(url: string) {
  if (!/^(https?:|mailto:)/i.test(url)) return;
  if (isDesktop) await native('open_link', { url });
  else window.open(url, '_blank', 'noopener,noreferrer');
}
