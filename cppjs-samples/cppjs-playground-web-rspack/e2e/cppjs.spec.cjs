// @ts-check
const { test, expect } = require('@playwright/test');

test('check string receiving from c++', async ({ page }) => {
    // Runs on all three engines: the runtime's OPFS preflight sidesteps
    // Playwright WebKit's broken storage backend (see fs-browser.js).
    await page.goto('/')
    await expect(page.getByText('ready (pthreads)')).toBeVisible()
    // The real mt signal: a std::thread ran and reported back.
    await expect(page.getByText('hello from thread')).toBeVisible()
});
