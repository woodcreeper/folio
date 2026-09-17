/** Keep the visible block in place when content above it changes. */
interface Anchor { id: string; tag: string; text: string; occurrence: number; offset: number }
export interface ReadingPosition { top: number; ratio: number; anchors: Anchor[] }
const textOf = (element: Element) => (element.textContent || '').replace(/\s+/g, ' ').trim();

export function capturePosition(scroll: HTMLElement, content: HTMLElement): ReadingPosition {
  const top = scroll.scrollTop;
  const maximum = scroll.scrollHeight - scroll.clientHeight;
  const edge = scroll.getBoundingClientRect().top;
  const blocks = [...content.children] as HTMLElement[];
  const visible = blocks.findIndex(block => block.getBoundingClientRect().bottom > edge + 1);
  const candidates = visible < 0 ? [] : blocks.slice(0, visible + 1).reverse();
  const anchors = candidates.filter((block, index) => index === 0 || /^H[1-6]$/.test(block.tagName)).slice(0, 4).map(block => {
    const text = textOf(block);
    const occurrence = blocks.slice(0, blocks.indexOf(block)).filter(item => item.tagName === block.tagName && textOf(item) === text).length;
    return { id: block.id, tag: block.tagName, text, occurrence, offset: block.getBoundingClientRect().top - edge };
  });
  return { top, ratio: maximum > 0 ? top / maximum : 0, anchors };
}

export function restorePosition(scroll: HTMLElement, content: HTMLElement, saved: ReadingPosition) {
  const blocks = [...content.children] as HTMLElement[];
  let target: number | undefined;
  if (saved.top < 2) target = 0;
  else for (const anchor of saved.anchors) {
    const block = anchor.id ? blocks.find(block => block.id === anchor.id) : blocks.filter(block => block.tagName === anchor.tag && textOf(block) === anchor.text)[anchor.occurrence];
    if (block) { target = scroll.scrollTop + block.getBoundingClientRect().top - scroll.getBoundingClientRect().top - anchor.offset; break; }
  }
  scrollInstantly(scroll, target ?? saved.ratio * Math.max(0, scroll.scrollHeight - scroll.clientHeight));
}

export function scrollInstantly(scroll: HTMLElement, top: number) {
  // Explicitly override CSS smooth scrolling without depending on the newer
  // `instant` ScrollBehavior value in older system webviews.
  const previous = scroll.style.scrollBehavior;
  scroll.style.scrollBehavior = 'auto';
  scroll.scrollTop = top;
  scroll.style.scrollBehavior = previous;
}
