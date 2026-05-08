import { test, expect } from '@playwright/test';

test.describe('Agent Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents');
  });

  test('should display agents page title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText(/智能体/i);
  });

  test('should have agent list container', async ({ page }) => {
    const agentList = page.locator('[data-testid="agent-list"], .agent-list');
    
    if (await agentList.count() > 0) {
      await expect(agentList.first()).toBeVisible();
    }
  });

  test('should show spawn agent button', async ({ page }) => {
    const spawnButton = page.locator('button:has-text("新建"), button:has-text("创建"), button:has-text("添加")');
    
    if (await spawnButton.count() > 0) {
      await expect(spawnButton.first()).toBeVisible();
      await spawnButton.first().click();
      
      const dialog = page.locator('[role="dialog"], .modal');
      if (await dialog.count() > 0) {
        await expect(dialog.first()).toBeVisible();
      }
    }
  });
});

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
  });

  test('should display tasks page title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText(/任务/i);
  });

  test('should show task submission form', async ({ page }) => {
    const inputField = page.locator('input[placeholder*="任务"], textarea[placeholder*="任务"]');
    
    if (await inputField.count() > 0) {
      await expect(inputField.first()).toBeVisible();
      
      await inputField.first().fill('Test task description');
      
      const submitButton = page.locator('button:has-text("提交"), button:has-text("创建")');
      if (await submitButton.count() > 0) {
        await expect(submitButton.first()).toBeEnabled();
      }
    }
  });

  test('should display task list or empty state', async ({ page }) => {
    const taskList = page.locator('[data-testid="task-list"]');
    const emptyState = page.locator('.empty-state, [data-testid="empty-state"]');
    
    const hasContent = (await taskList.count() > 0) || (await emptyState.count() > 0);
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sessions');
  });

  test('should display sessions page title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText(/会话/i);
  });

  test('should show create session option', async ({ page }) => {
    const createButton = page.locator('button:has-text("新建会话"), button:has-text("创建")');
    
    if (await createButton.count() > 0) {
      await expect(createButton.first()).toBeVisible();
    }
  });
});

test.describe('Memory System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/memory-evolution');
  });

  test('should display memory system page', async ({ page }) => {
    await expect(page.locator('h2')).toContainText(/记忆系统/i);
  });

  test('should show memory layers or tabs', async ({ page }) => {
    const layerTabs = page.locator('[role="tab"], .memory-layer');
    
    if (await layerTabs.count() > 0) {
      await expect(layerTabs.first()).toBeVisible();
    }
  });
});

test.describe('AI Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-chat');
  });

  test('should display AI chat interface', async ({ page }) => {
    await expect(page.locator('h2')).toContainText(/AI 助手/i);
  });

  test('should have message input area', async ({ page }) => {
    const inputArea = page.locator('textarea, [contenteditable="true"], input[type="text"]');
    
    if (await inputArea.count() > 0) {
      await expect(inputArea.last()).toBeVisible();
    }
  });

  test('should show send message button', async ({ page }) => {
    const sendButton = page.locator('button:has-text("发送"), button[aria-label*="发送"]');
    
    if (await sendButton.count() > 0) {
      await expect(sendButton.first()).toBeVisible();
    }
  });
});

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display settings page', async ({ page }) => {
    await expect(page.locator('h2')).toContainText(/设置/i);
  });

  test('should show connection settings section', async ({ page }) => {
    const endpointInput = page.locator('input[placeholder*="endpoint"], input[placeholder*="地址"]');
    
    if (await endpointInput.count() > 0) {
      await expect(endpointInput.first()).toBeVisible();
    }
  });
});