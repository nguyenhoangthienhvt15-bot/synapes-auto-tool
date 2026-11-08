import { test, expect } from '@playwright/test';

test.describe('Lịch phát sóng & Khung giờ vàng Goldtime', () => {
  test('Kiểm tra chuyển đổi tab Lịch phát sóng', async ({ page }) => {
    await page.goto('/');

    const scheduleNav = page.locator('button:has-text("Lịch Phát Sóng"), nav a:has-text("Lịch")').first();
    if (await scheduleNav.isVisible()) {
      await scheduleNav.click();

      // Kiểm tra sự xuất hiện của các khung giờ Goldtime
      const content = await page.textContent('body');
      expect(content).toContain('Khung Giờ');
    }
  });
});
