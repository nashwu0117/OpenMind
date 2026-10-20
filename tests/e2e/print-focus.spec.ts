import {test, expect} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';

test('branch preview expands into an editable focused workspace and Escape restores the map', async ({page}) => {
  await page.goto('/'); const canvas = page.getByTestId('canvas');
  await expect(canvas.locator('[data-node-id]')).toHaveCount(17);
  await canvas.locator('[data-node-id]').filter({hasText: '探索方向'}).click();
  await page.getByRole('button', {name: '收合分支', exact: true}).click();
  await expect(canvas.locator('[data-node-id]')).toHaveCount(14);
  await expect(page.getByText('已儲存於此裝置', {exact: true})).toBeVisible();
  const original = await page.evaluate(() => localStorage.getItem('openmind.recovery.v1'));
  await page.getByRole('button', {name: '預覽選取分支', exact: true}).click();
  const preview = page.getByRole('region', {name: '分支預覽'});
  await expect(preview).toBeVisible(); await expect(preview.locator('[data-node-id]')).toHaveCount(4);
  await preview.getByRole('button', {name: '展開此分支'}).click();
  await expect(page.locator('.app')).toHaveClass('app editor-focus');
  await expect(page.locator('.sidebar')).not.toBeVisible(); await expect(page.locator('.inspector')).not.toBeVisible();
  await expect(canvas.locator('[data-node-id]')).toHaveCount(4);
  expect(await page.evaluate(() => localStorage.getItem('openmind.recovery.v1'))).toBe(original);
  await page.screenshot({path: 'artifacts/editor-focus.png'});
  await page.keyboard.press('Escape'); await expect(canvas.locator('[data-node-id]')).toHaveCount(14);
  expect(await page.evaluate(() => localStorage.getItem('openmind.recovery.v1'))).toBe(original);
  await page.getByRole('button', {name: '預覽選取分支', exact: true}).click();
  await preview.getByRole('button', {name: '展開此分支'}).click();
  await page.getByRole('button', {name: '大綱', exact: true}).click();
  await expect(page.locator('.outliner .outline-row')).toHaveCount(4);
  await page.getByRole('button', {name: '心智圖', exact: true}).click();
  await canvas.locator('[data-node-id]').first().click(); await page.keyboard.press('Tab'); await page.getByLabel('編輯主題文字', {exact: true}).fill('專注後新增的想法'); await page.getByRole('button', {name: '完成編輯'}).click();
  await expect(canvas.locator('[data-node-id]')).toHaveCount(5);
  await page.keyboard.press('Escape'); await expect(page.locator('.app')).toHaveClass('app');
  await expect(page.locator('.sidebar')).toBeVisible(); await expect(canvas.locator('[data-node-id]')).toHaveCount(18);
});

test('print preview expands, zooms and navigates without changing physical output', async ({page}) => {
  await page.goto('/'); await page.getByRole('button', {name: '列印與 PDF', exact: true}).click();
  await page.getByRole('button', {name: /主要分支分頁/}).click();
  const initial = await page.locator('.print-metrics').textContent();
  await page.getByRole('button', {name: '展開專注預覽', exact: true}).click();
  await expect(page.getByRole('complementary', {name: '列印設定'})).not.toBeVisible();
  const paper = page.getByTestId('print-page'), before = (await paper.boundingBox())!.width;
  await page.getByRole('button', {name: '預覽放大', exact: true}).click();
  expect((await paper.boundingBox())!.width).toBeGreaterThan(before);
  await expect(page.locator('.print-metrics')).toHaveText(initial!);
  await page.getByRole('button', {name: '下一頁', exact: true}).click(); await expect(paper).toHaveAttribute('data-page-number', '2');
  await page.keyboard.press('ArrowRight'); await expect(paper).toHaveAttribute('data-page-number', '3');
  await page.getByRole('button', {name: '預覽適合視窗', exact: true}).click();
  await page.screenshot({path: 'artifacts/print-focus.png'});
  await page.keyboard.press('Escape'); await expect(page.getByRole('complementary', {name: '列印設定'})).toBeVisible();
});

test('actual embedded font subsets, branch continuations and cross-page relationship PDF', async ({page, context}) => {
  await page.goto('/'); await page.waitForLoadState('networkidle');
  const data = await page.evaluate(async () => {
    const mp = '/src/core/model.ts', ep = '/src/engine/print.ts', fp = '/src/engine/fontEmbedding.ts';
    const m = await import(mp), e = await import(ep), fonts = await import(fp);
    const b = m.fixture(80), s = m.activeSheet(b), ids = Object.keys(s.nodes);
    s.nodes[s.rootId].text = '臺灣繁體中文印刷驗證 龜鬱體積 ABC 123';
    s.relationships.push({id: m.uid(), from: ids[10], to: ids[70], text: '跨頁審核與依賴關係', directed: true, dashed: true});
    const plan = e.planPrint(s, {...e.defaultPrint, mode: 'branches', landscape: false});
    const face = await fonts.embeddedFontCSS('臺灣繁體中文 龜鬱與 ABC 123');
    return {html: await e.preparePrintHTML(plan), book: b, pages: plan.pages.length, widthMM: plan.widthMM, heightMM: plan.heightMM,
      minPt: plan.estimatedPt, topics: plan.topicPages, indexPages: plan.indexPages,
      from: ids[10], to: ids[70], subsetCount: face.subsets, missing: face.missing,
      requestsExternalFont: /url\((?:https?:|\.\/)/.test(face.css), refs: plan.pages.map((p: {references: unknown[]}) => p.references)};
  });
  expect(data.subsetCount).toBeGreaterThan(1); expect(data.missing).toEqual([]); expect(data.requestsExternalFont).toBe(false);
  expect(data.minPt).toBeGreaterThanOrEqual(10); expect(data.indexPages.length).toBeGreaterThan(0);
  await page.getByTestId('file-input').setInputFiles({name: 'cross-page.openmind', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data.book))});
  await page.getByRole('button', {name: '列印與 PDF', exact: true}).click(); await page.getByRole('button', {name: /主要分支分頁/}).click();
  await page.getByLabel('列印方向', {exact: true}).selectOption('portrait');
  const sourcePage = data.topics[data.from][0], targetPage = data.topics[data.to][0];
  await page.getByLabel('預覽頁碼', {exact: true}).selectOption(String(sourcePage - 1));
  const crossLink = page.getByTestId('print-page').locator(`[data-target-page="${targetPage}"]`).filter({hasText: 'R1'});
  await expect(crossLink).toBeVisible(); await crossLink.click(); await expect(page.getByTestId('print-page')).toHaveAttribute('data-page-number', String(targetPage));
  await page.getByRole('button', {name: '關係索引', exact: true}).click(); await expect(page.getByTestId('print-page')).toContainText('跨頁審核與依賴關係');
  await page.screenshot({path: 'artifacts/relationship-index-preview.png'});
  const output = await context.newPage(); const external: string[] = [];
  output.on('request', request => {if (/^https?:/.test(request.url())) external.push(request.url());});
  await output.setContent(data.html); await output.evaluate(() => document.fonts.ready);
  expect(external).toEqual([]); await mkdir('artifacts/phase2', {recursive: true});
  await output.pdf({path: 'artifacts/phase2/branches-cjk-relations.pdf', preferCSSPageSize: true, printBackground: true});
  await writeFile('artifacts/phase2/manifest.json', JSON.stringify({...data, html: undefined, book: undefined}, null, 2));
  await output.close();
});
