// @ts-check
const { test, expect } = require('@playwright/test');

test('check string receiving from c++', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Matrix multiplier with c++   =>   J₃ * (2*J₃) = 6*J₃')).toBeVisible()
});

test('check thread result from c++', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Thread computed: (3*J₃) * (4*J₃) = 36*J₃')).toBeVisible({ timeout: 10000 })
});
