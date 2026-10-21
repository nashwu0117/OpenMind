export type PrintLocale = 'zh-TW' | 'en';
export type PrintTranslator = (source: string, values?: Array<string | number>) => string;

export function printText(translate: PrintTranslator | undefined, source: string, values?: Array<string | number>): string {
  if (translate) return translate(source, values);
  return values ? source.replace(/\{(\d+)\}/g, (_match, index: string) => String(values[Number(index)] ?? '')) : source;
}
