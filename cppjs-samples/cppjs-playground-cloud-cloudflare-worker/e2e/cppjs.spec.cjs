// @ts-check
const { test, expect } = require('@playwright/test');

test('check string receiving from c++', async ({ page }) => {
    await page.goto('/')
    // The playground worker responds with `- ${Native.sample()} -`.
    await expect(page.getByText('- hello -')).toBeVisible()
});
