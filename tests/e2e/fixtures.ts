import { test as base, chromium, type BrowserContext } from '@playwright/test';

export type ExtensionOptions = {
  extensionId: string;
};

export const test = base.extend<{ context: BrowserContext & ExtensionOptions }>({
  context: async ({}, use) => {
    const pathToExtension = 'dist'; // Path to built extension
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    // Get extension ID
    const [backgroundPage] = context.serviceWorkers();
    if (!backgroundPage) {
      throw new Error('Background page not found');
    }

    const extensionId = backgroundPage.url().split('/')[2];

    await use(context as BrowserContext & ExtensionOptions);

    await context.close();
  },
});

export const expect = test.expect;
