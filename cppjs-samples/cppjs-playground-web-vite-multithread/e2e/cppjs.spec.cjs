// @ts-check
const { test, expect } = require('@playwright/test');

test('boots the module in a worker and runs a std::thread', async ({ page, browserName }) => {
    // Verified 2026-07-03: the pthreads (mt) module never finishes booting in
    // Playwright's WebKit even on the stock runtime, despite
    // crossOriginIsolated being true. Chromium and Firefox cover this spec.
    test.skip(browserName === 'webkit', 'mt wasm module does not boot in Playwright WebKit');
    await page.goto('/')
    await expect(page.getByText('ready (worker + pthreads)')).toBeVisible()
    await expect(page.getByText('hello from thread')).toBeVisible()
});
