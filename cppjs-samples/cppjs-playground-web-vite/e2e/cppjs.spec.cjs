// @ts-check
const { test, expect } = require('@playwright/test');

test('check string receiving from c++', async ({ page }) => {
    await page.goto('/')
    // The playground native's sample() returns "hello".
    await expect(page.getByText('Matrix multiplier with c++ => hello')).toBeVisible()
});
