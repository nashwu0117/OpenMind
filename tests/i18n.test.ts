import {afterEach, expect, test} from 'vitest';
import * as ts from 'typescript';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {setLocale, t, tTemplate} from '../src/ui/i18n';
import {activeSheet, fixture, newWorkbook} from '../src/core/model';
import {defaultPrint, pageSVG, planPrint, printHTML} from '../src/engine/print';

afterEach(() => setLocale('zh-TW'));

test('every static UI and print translation used by the app has an English value', () => {
  setLocale('en');
  const files = [
    ...readdirSync('src/ui').filter(file => file.endsWith('.tsx') && file !== 'i18n.tsx').map(file => join('src/ui', file)),
    'src/engine/print.ts', 'src/engine/pagination.ts', 'src/engine/pageReferences.ts', 'src/engine/viewPlans.ts', 'src/io/printing.ts'
  ];
  const messages = new Map<string, boolean>();
  for (const path of files) {
    const source = readFileSync(path, 'utf8');
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ['t', 'tTemplate', 'tr'].includes(node.expression.text)) {
        const key = node.arguments[0];
        if (key && (ts.isStringLiteral(key) || ts.isNoSubstitutionTemplateLiteral(key))) {
          messages.set(key.text, node.expression.text === 'tTemplate' || (node.expression.text === 'tr' && node.arguments.length > 1));
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  const missing = [...messages].flatMap(([key, templated]) => {
    const english = templated ? tTemplate(key, []) : t(key);
    return /[\u3400-\u9fff]/.test(english) ? [key] : [];
  });
  expect(missing).toEqual([]);
});

test('locale selection is persistent and switches translations without changing source data', () => {
  setLocale('zh-TW');
  expect(t('列印與 PDF')).toBe('列印與 PDF');
  setLocale('en');
  expect(t('列印與 PDF')).toBe('Print & PDF');
  expect(tTemplate('任務名稱 {0}', ['a1'])).toBe('Task name a1');
  expect(t('使用者自訂的想法')).toBe('使用者自訂的想法');
});

test('print plan labels, HTML language, title, poster guides and errors follow the selected locale', () => {
  setLocale('en');
  const translate = (source: string, values?: Array<string | number>) => values ? tTemplate(source, values) : t(source);
  const sheet = activeSheet(newWorkbook());
  const settings = {...defaultPrint, locale: 'en' as const, translate};
  const fit = planPrint(sheet, settings);
  expect(fit.pages[0].label).toBe('Full Mind Map');
  expect(printHTML(fit)).toContain('<html lang="en">');
  expect(printHTML(fit)).toContain('<title>OpenMind Print</title>');
  const poster = planPrint(sheet, {...settings, mode: 'poster'});
  expect(poster.pages[0].label).toBe('Poster tile: row 1 / column 1');
  expect(poster.warnings[0]).toContain('Poster: 1 rows × 1 columns');
  expect(() => planPrint(sheet, {...settings, margin: 200})).toThrow('Paper size, margins, overlap, or minimum font size is outside the supported range.');
  const large = activeSheet(fixture(200)), ids = Object.keys(large.nodes);
  large.relationships.push({id: 'english-cross-page', from: ids[1], to: ids.at(-1)!, text: 'User relationship text', directed: true, dashed: false});
  const indexed = planPrint(large, {...settings, mode: 'readable'});
  expect(indexed.indexPages.length).toBeGreaterThan(0);
  const indexSvg = pageSVG(indexed, indexed.indexPages[0] - 1);
  expect(indexSvg).toContain('From page ');
  expect(indexSvg).toContain('Points to: page ');
  expect(indexSvg).toContain('User relationship text');
});
