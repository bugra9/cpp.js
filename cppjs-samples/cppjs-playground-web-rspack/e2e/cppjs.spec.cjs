// @ts-check
const { test, expect } = require('@playwright/test');

test('check string receiving from c++', async ({ page, browserName }) => {
    // Same limitation as the multithread vite playground: the pthreads (mt)
    // module never finishes booting in Playwright's WebKit.
    test.skip(browserName === 'webkit', 'mt wasm module does not boot in Playwright WebKit');
    await page.goto('/')
    await expect(page.getByText('ready (pthreads)')).toBeVisible()
    // The real mt signal: a std::thread ran and reported back.
    await expect(page.getByText('hello from thread')).toBeVisible()
});
