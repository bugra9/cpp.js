// @ts-check
const { test, expect } = require('@playwright/test');

test('check string receiving from c++', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Hello World, greetings from c++.')).toBeVisible()
});
