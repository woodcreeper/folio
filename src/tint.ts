// Tint the existing palette so reading presets keep their own light/dark bases.
// Calculated colors also work on WebViews that predate CSS color-mix().
type RGB = [number, number, number];

export function normalizeTint(value: unknown): string | null {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : null;
}

function rgb(hex: string): RGB {
  return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16)) as RGB;
}

function mix(base: string, tint: string, amount: number): string {
  const color = rgb(tint);
  return '#' + rgb(base).map((channel, i) => Math.round(channel + (color[i] - channel) * amount).toString(16).padStart(2, '0')).join('');
}

function luminance(color: string): number {
  const channels = rgb(color).map(channel => {
    const value = channel / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}

function contrast(first: string, second: string): number {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

const surfaces = {
  app: { bg: .04, sidebar: .08, paper: .025, border: .14, active: .18, hover: .12 },
  reader: { paper: .025, rule: .14, code: .05, quote: .05, selection: .24 },
} as const;

const properties = (['light', 'dark'] as const).flatMap(scheme =>
  Object.entries(surfaces).flatMap(([area, roles]) =>
    [...Object.keys(roles), 'accent'].map(role => `--${area}-${scheme}-${role}`)));

export function applyTint(root: HTMLElement, value: string | null) {
  // Always start from stylesheet defaults, including a newly selected preset.
  // Removing only our overrides leaves reading size and other preferences alone.
  properties.forEach(property => root.style.removeProperty(property));
  const tint = normalizeTint(value);
  if (!tint) return;
  const defaults = getComputedStyle(root);
  const colors: Record<string, string> = {};
  for (const scheme of ['light', 'dark'] as const) {
    for (const [area, roles] of Object.entries(surfaces)) {
      for (const [role, amount] of Object.entries(roles)) {
        const property = `--${area}-${scheme}-${role}`;
        colors[property] = mix(defaults.getPropertyValue(property).trim(), tint, amount);
      }
    }
    // A bright yellow or very dark custom color still needs a readable accent.
    // Include selected/hover surfaces, where small control labels use this color.
    const backgrounds = ['app-bg', 'app-sidebar', 'app-paper', 'app-active', 'app-hover', 'reader-paper', 'reader-code', 'reader-quote']
      .map(key => { const [area, role] = key.split('-'); return colors[`--${area}-${scheme}-${role}`]; });
    let accent = tint;
    for (let step = 0; step <= 100; step++) {
      accent = mix(tint, scheme === 'light' ? '#000000' : '#ffffff', step / 100);
      if (backgrounds.every(background => contrast(accent, background) >= 4.5)) break;
    }
    colors[`--app-${scheme}-accent`] = accent;
    colors[`--reader-${scheme}-accent`] = accent;
  }
  Object.entries(colors).forEach(([property, color]) => root.style.setProperty(property, color));
}
