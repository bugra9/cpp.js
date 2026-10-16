import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { markdownPages } from '../src/llms/index.js';

// The site's copy reads as written by hand: periods, commas, colons and parentheses, no em dash. The pages under
// /api/ are docs/api word for word and keep their own style.
const EM_DASH = '—';

test('no page of the site uses an em dash', () => {
    for (const page of markdownPages().filter((entry) => !entry.path.startsWith('/api/'))) {
        const at = page.markdown.indexOf(EM_DASH);
        assert.equal(at, -1, `${page.path}: …${page.markdown.slice(Math.max(0, at - 40), at + 40)}…`);
    }
});

test('the not-found page is titled like every other page', () => {
    const html = readFileSync(new URL('../public/404.html', import.meta.url), 'utf8');
    assert.match(html, /<title>Not found · crossbind<\/title>/);
});
