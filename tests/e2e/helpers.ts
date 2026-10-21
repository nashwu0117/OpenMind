import { expect, type Page } from '@playwright/test';

export async function openFirstMap(page: Page) {
  await expect(page.locator('.library')).toBeVisible();
  await page.locator('.document-card').first().click();
  await expect(page).toHaveURL(/#\/map\/[^/]+$/);
  await expect(page.getByTestId('canvas')).toBeVisible();
}

export async function openSampleMap(page: Page) {
  await page.goto('/');
  await openFirstMap(page);
}
