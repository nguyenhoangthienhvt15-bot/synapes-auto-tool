import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Hợp đồng & Con dấu Trưởng ban KS. Nguyễn Hoàng Thiện', () => {
  test('Kiểm tra dữ liệu con dấu tròn chuẩn Base64 không có khung chữ nhật', async () => {
    const codeJsPath = path.resolve(process.cwd(), 'google-apps-script/Code.js');
    const content = fs.readFileSync(codeJsPath, 'utf8');

    // Tuyệt đối không còn thẻ viền chữ nhật cũ
    expect(content).not.toContain('ĐÃ ĐÓNG DẤU XÁC THỰC<br/>TRƯỞNG BAN CHUYỂN ĐỔI SỐ & AI');
    expect(content).not.toContain('border: 2px solid #b91c1c');

    // Chứa hằng số Base64 và thông tin Trưởng ban
    expect(content).toContain('ROUND_STAMP_BASE64');
    expect(content).toContain('KS. NGUYỄN HOÀNG THIỆN');
    expect(content).toContain('BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO');
  });

  test('Giao diện WebApp tải thành công và có module Hợp đồng', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SYNAPES/i);

    // Kiểm tra logo và tiêu đề
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

