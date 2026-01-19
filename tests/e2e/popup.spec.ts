import { test, expect } from './fixtures';

test.describe('Extension Popup', () => {
  test('should open popup and display title', async ({ context }) => {
    const extensionId = context.extensionId;
    const page = await context.newPage();

    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    await expect(page.locator('h1')).toContainText('Tingly Polish');
  });

  test('should display config tab by default', async ({ context }) => {
    const extensionId = context.extensionId;
    const page = await context.newPage();

    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    await expect(page.locator('text=API Configuration')).toBeVisible();
    await expect(page.locator('text=api_key')).toBeVisible();
  });

  test('should switch to history tab', async ({ context }) => {
    const extensionId = context.extensionId;
    const page = await context.newPage();

    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    await page.click('button:has-text("History")');

    await expect(page.locator('text=History')).toBeVisible();
  });

  test('should save configuration', async ({ context }) => {
    const extensionId = context.extensionId;
    const page = await context.newPage();

    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    await page.fill('input#apiKey', 'test-api-key');
    await page.fill('input#baseUrl', 'https://api.example.com/v1');
    await page.fill('input#model', 'test-model');

    await page.click('button:has-text("Save Configuration")');

    // Check for success message
    await expect(page.locator('text=Configuration saved')).toBeVisible({ timeout: 3000 });
  });

  test('should restore default prompts', async ({ context }) => {
    const extensionId = context.extensionId;
    const page = await context.newPage();

    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    const defaultText = 'You are a professional language assistant';

    await page.fill('textarea#systemPrompt', 'modified prompt');
    await page.click('button:has-text("Restore Default Prompts")');

    const systemPrompt = await page.inputValue('textarea#systemPrompt');
    expect(systemPrompt).toContain(defaultText);
  });
});
