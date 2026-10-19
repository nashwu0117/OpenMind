import regularCSS from '@fontsource/noto-sans-tc/400.css?raw';
import boldCSS from '@fontsource/noto-sans-tc/700.css?raw';
const sourceCSS = regularCSS + '\n' + boldCSS;

// Vite inlines local assets here so Electron's sandbox never needs file:// fetch.
// This module is lazy-loaded only when preparing a print/export document.
const assets = import.meta.glob<string>(
  ['/node_modules/@fontsource/noto-sans-tc/files/*-{400,700}-normal.woff2',
    '!/node_modules/@fontsource/noto-sans-tc/files/noto-sans-tc-chinese-traditional-*.woff2'],
  {query: '?inline', import: 'default'},
);
const byName = new Map(Object.entries(assets).map(([path, data]) => [path.split('/').at(-1)!, data]));
const faces = [...sourceCSS.matchAll(/@font-face\s*\{[^}]+\}/g)].map(([css]) => {
  const name = /url\(\.\/files\/([^)]+)\)/.exec(css)?.[1];
  const ranges = /unicode-range:\s*([^;]+);/.exec(css)?.[1].split(',').map(value => {
    const [start, end] = value.trim().replace(/^U\+/i, '').split('-');
    return [parseInt(start, 16), parseInt(end ?? start, 16)] as const;
  }) ?? [];
  return {css, name, ranges};
});

export async function embeddedFontCSS(text: string): Promise<{css: string; subsets: number; missing: string[]}> {
  const characters = [...new Set(Array.from(text).filter(c => !/\s/u.test(c)))];
  const points = characters.map(c => c.codePointAt(0)!);
  const covered = new Set<number>();
  const selected = await Promise.all(faces.map(async face => {
    const matches = points.filter(point => face.ranges.some(([a, b]) => point >= a && point <= b));
    if (!matches.length) return '';
    const loader = face.name ? byName.get(face.name) : undefined;
    const data = loader ? await loader() : undefined;
    if (!data?.startsWith('data:')) throw new Error('內嵌繁體中文字型遺失，請重新安裝套件並建置。');
    matches.forEach(point => covered.add(point));
    return face.css.replace(/src:[^;]+;/, `src: url(${data}) format('woff2');`).replace('font-display: swap', 'font-display: block');
  }));
  const included = selected.filter(Boolean);
  return {css: included.join('\n'), subsets: included.length, missing: characters.filter(c => !covered.has(c.codePointAt(0)!))};
}
