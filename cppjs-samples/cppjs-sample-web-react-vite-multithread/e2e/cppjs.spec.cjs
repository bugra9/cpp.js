// @ts-check
const { test, expect } = require('@playwright/test');

// WebKit's pthread + SharedArrayBuffer support is too flaky on Linux for the
// multithread sample to initialise reliably (page stays on "compiling ...").
// Skip the entire suite for webkit; chromium and firefox cover the mt path.
test.skip(({ browserName }) => browserName === 'webkit', 'mt sample requires pthread + SAB; webkit Linux support is unreliable');

test('check string receiving from c++', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Matrix multiplier with c++   =>   J₃ * (2*J₃) = 6*J₃')).toBeVisible()
});

test('check thread result from c++', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Thread computed: (3*J₃) * (4*J₃) = 36*J₃')).toBeVisible({ timeout: 10000 })
});
