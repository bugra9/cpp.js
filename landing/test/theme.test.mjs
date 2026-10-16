import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The site opens light. Only a visitor's own toggle, which theme.js stores, opens it dark; the system preference
// plays no part. theme.js imports Preact, so its source is read rather than run.
const PAGE = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const HOOK = readFileSync(new URL('../src/theme.js', import.meta.url), 'utf8');

test('neither the pre-paint script nor the theme hook follows the system preference', () => {
    assert.ok(!PAGE.includes('prefers-color-scheme'));
    assert.ok(!HOOK.includes('prefers-color-scheme'));
});

test('the pre-paint script reads the choice theme.js stores', () => {
    const [, key] = HOOK.match(/THEME_KEY = '([^']+)'/);
    assert.ok(PAGE.includes(`localStorage.getItem('${key}')`));
});
