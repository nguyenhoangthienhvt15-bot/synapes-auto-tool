import { test, expect } from '@playwright/test';

test.describe('Khuôn mẫu Tạo Video & Phong cách biên tập', () => {
  test('Kiểm tra các thành phần giao diện tạo video cốt lõi', async ({ page }) => {
    await page.goto('/');

    // Tìm nút Tạo Dự Án Mới
    const createBtn = page.locator('button:has-text("Dự Án Mới"), button:has-text("Tạo dự án"), button:has-text("Khởi Tạo")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();

      // Kiểm tra 2 khuôn mẫu: Video Dài và Video Ngắn
      const modal = page.locator('div[role="dialog"], .fixed');
      await expect(modal).toBeVisible();

      const text = await modal.textContent();
      expect(text).toContain('16:9');
      expect(text).toContain('9:16');
      expect(text).not.toContain('Lấy Tin Nóng Live');
    }
  });
});
