import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Start browser for pre-setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Wait for the dev server to be ready
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5173';
  
  console.log('⏳ Waiting for dev server to be ready...');
  
  // Poll the server until it's ready
  let retries = 30;
  while (retries > 0) {
    try {
      await page.goto(baseURL, { waitUntil: 'networkidle' });
      console.log('✅ Dev server is ready');
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        throw new Error(`Dev server failed to start at ${baseURL}`);
      }
      console.log(`⏳ Dev server not ready, retrying... (${retries} left)`);
      await page.waitForTimeout(2000);
    }
  }

  // Cleanup
  await context.close();
  await browser.close();

  console.log('🚀 Global setup complete');
}

export default globalSetup;