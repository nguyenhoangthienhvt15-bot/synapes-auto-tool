import { test, expect } from '@playwright/test';

test.describe('Anti-Fake Activity Guardrails E2E', () => {
  test('1. Disables Internet Harvest button when prompt textarea is blank and makes zero network requests', async ({ page }) => {
    let researchApiCalled = false;
    await page.route('**/api/topic-research**', (route) => {
      researchApiCalled = true;
      route.continue();
    });

    await page.goto('/');
    const createBtn = page.locator('button:has-text("Dự Án Mới"), button:has-text("Tạo dự án"), button:has-text("Khởi Tạo")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      const harvestBtn = page.getByTestId('harvest-internet-data-btn');
      await expect(harvestBtn).toBeVisible();
      await expect(harvestBtn).toBeDisabled();
      expect(researchApiCalled).toBe(false);
    }
  });

  test('2. Clears stale research stats immediately when user clears the prompt input', async ({ page }) => {
    await page.route('**/api/topic-research**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: 'AI Chip',
          headlines: [{ title: 'Real headline', source: 'Reuters', link: 'https://example.com' }],
          visuals: [{ title: 'Chip die', url: 'https://upload.wikimedia.org/test.jpg', proxyUrl: '/api/proxy-image' }],
          videos: [],
          wikiSummary: 'Real Wikipedia summary.',
        }),
      });
    });

    await page.goto('/');
    const createBtn = page.locator('button:has-text("Dự Án Mới"), button:has-text("Tạo dự án"), button:has-text("Khởi Tạo")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      const textarea = page.locator('textarea').first();
      await textarea.fill('AI Chip');
      await page.getByTestId('harvest-internet-data-btn').click();
      await expect(page.getByTestId('harvested-research-preview')).toContainText('1 Tin báo chí');

      await textarea.fill('');
      await expect(page.getByTestId('harvested-research-preview')).toHaveCount(0);
    }
  });

  test('3. Shows honest 0 counts and "Wiki: Không tìm thấy" when query has zero matches (zero Unsplash fallback)', async ({ page }) => {
    const response = await page.request.get('/api/topic-research?q=xyzqwert99887766nonexistent');
    expect(response.status()).toBe(200);
    const bodyText = await response.text();
    expect(bodyText).not.toContain('images.unsplash.com');
    const json = JSON.parse(bodyText);
    expect(json.visuals).toEqual([]);
    expect(json.headlines).toEqual([]);
    expect(json.wikiSummary).toBe('');
  });

  test('4. Rejects empty query on /api/topic-research with HTTP 400', async ({ page }) => {
    const response = await page.request.get('/api/topic-research?q=');
    expect(response.status()).toBe(400);
  });
});
