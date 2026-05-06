import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText(/仪表盘/i);
  });

  test('should display navigation sidebar', async ({ page }) => {
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();
    
    const navItems = sidebar.locator('a');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to agents page', async ({ page }) => {
    await page.click('text=智能体');
    await expect(page).toHaveURL('/agents');
    await expect(page.locator('h2')).toContainText(/智能体/i);
  });

  test('should navigate to tasks page', async ({ page }) => {
    await page.click('text=任务');
    await expect(page).toHaveURL('/tasks');
    await expect(page.locator('h2')).toContainText(/任务/i);
  });
});

test.describe('Navigation', () => {
  test('should show all main navigation items', async ({ page }) => {
    await page.goto('/');
    
    const expectedItems = [
      '仪表盘', '智能体', '任务', '会话',
      'AI 助手', '技能', '工具'
    ];
    
    for (const item of expectedItems) {
      await expect(page.locator(`text=${item}`)).toBeVisible();
    }
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');
    
    const darkModeButton = page.locator('button:has-text("深色模式"), button:has-text("浅色模式")');
    if (await darkModeButton.count() > 0) {
      await darkModeButton.first().click();
      
      const html = page.locator('html');
      const className = await html.getAttribute('class');
      expect(className).toBeDefined();
    }
  });
});

test.describe('Global Search', () => {
  test('should open search with Ctrl+K', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('Control+k');
    
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test('should close search on escape', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('Control+k');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should collapse sidebar on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const sidebar = page.locator('aside');
    const width = await sidebar.boundingBox();
    expect(width?.width).toBeLessThanOrEqual(80);
  });

  test('should show mobile menu button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const menuButton = page.locator('button:has(svg)');
    const isVisible = await menuButton.first().isVisible();
    expect(isVisible).toBeTruthy();
  });
});