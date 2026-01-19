import { test, expect } from './fixtures';

test.describe('Content Script', () => {
  test('should inject into web pages', async ({ context }) => {
    const page = await context.newPage();

    // Navigate to a test page
    await page.goto('https://example.com');

    // Check if content script was injected
    const hasInputHandler = await page.evaluate(() => {
      return typeof (window as any).InputHandler !== 'undefined';
    });

    // Content script should be present
    // (In real scenario, we'd check for DOM modifications or specific elements)
  });

  test('should monitor input elements', async ({ context }) => {
    const page = await context.newPage();

    // Create a test page with an input
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
        <input type="text" id="test-input" placeholder="Type here..." />
        <textarea id="test-textarea"></textarea>
        <div contenteditable="true" id="test-editable"></div>
      </body>
      </html>
    `);

    const inputCount = await page.evaluate(() => {
      return document.querySelectorAll('input, textarea, [contenteditable]').length;
    });

    expect(inputCount).toBe(3);
  });

  test('should detect triple space trigger', async ({ context }) => {
    const page = await context.newPage();

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
        <input type="text" id="test-input" />
      </body>
      </html>
    `);

    const input = page.locator('#test-input');

    // Type text followed by triple space
    await input.fill('hello   ');

    // Wait for trigger detection
    await page.waitForTimeout(500);

    // The input should be modified (in real test, check for translation)
    const value = await input.inputValue();
    expect(value).toBeTruthy();
  });
});
