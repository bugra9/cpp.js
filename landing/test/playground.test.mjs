import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { SITE_ROUTES } from '../src/site-pages.js';
import PLAYGROUND_PAGE from '../src/pages/playground.js';
import { HERO_CONFIG } from '../src/data.js';
import { SKIN_PARAM, readSkin } from '../src/playground/skin.js';
import { LIMITS } from '../../tooling/cloud/compiler/sandbox.js';
import { packagesFor } from '../../tooling/cloud/compiler/packages.js';
import { sampleProject } from '../../scripts/site/build-example-demos.mjs';

const html = readFileSync(new URL('../public/playground/sandbox.html', import.meta.url), 'utf8');
const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
const script = html.slice(html.indexOf('<script>') + '<script>'.length, html.indexOf('</script>'));
const scriptHash = `'sha256-${createHash('sha256').update(script, 'utf8').digest('base64')}'`;
const headerPolicy = headers.split('\n').map((line) => line.trim()).find((line) => line.startsWith('Content-Security-Policy: sandbox'));
const ruleOf = (path) => headers.match(new RegExp(`^${path.replaceAll('.', '\\.')}\\n((?: {2}.+\\n?)+)`, 'm'))?.[1].trim();

test('the sandbox page runs its one inline script by hash, in its own policy and in the header', () => {
    assert.equal(html.match(/<script/g).length, 1);
    assert.ok(html.includes(`script-src ${scriptHash} blob:`), 'the meta policy names the script hash');
    assert.ok(headerPolicy.includes(`script-src ${scriptHash} blob:`), 'the header policy names the script hash');
});

test('the sandbox header keeps visitor code in an opaque origin with no way out, even on its own', () => {
    assert.match(headerPolicy, /^Content-Security-Policy: sandbox allow-scripts; /);
    assert.doesNotMatch(headerPolicy, /allow-same-origin|allow-top-navigation|allow-popups|allow-forms|allow-modals/);
    assert.match(headerPolicy, /default-src 'none'/);
    assert.doesNotMatch(headerPolicy, /connect-src|img-src|frame-src/);
    assert.match(headerPolicy, /frame-ancestors 'self'/);
});

test('Cloudflare Pages serves the sandbox page at /playground/sandbox, so that path has the same headers', () => {
    assert.ok(ruleOf('/playground/sandbox.html').includes(headerPolicy));
    assert.equal(ruleOf('/playground/sandbox'), ruleOf('/playground/sandbox.html'));
});

test('the playground is a page of the site, so it is prerendered and in the sitemap', () => {
    assert.ok(SITE_ROUTES.includes('/playground/'));
});

test('the page names the time and memory a compile gets in the sandbox', () => {
    const text = JSON.stringify(PLAYGROUND_PAGE);
    assert.ok(text.includes(`${LIMITS.wallMs / 1000} seconds`));
    assert.ok(text.includes(`${LIMITS.dataBytes / 1024 ** 3} GB of memory`));
});

test('until the first run the console says what a compile gets and links Privacy', () => {
    const intro = PLAYGROUND_PAGE.intro.join(' ');
    assert.ok(intro.includes(`${LIMITS.wallMs / 1000} seconds`));
    assert.ok(intro.includes(`${LIMITS.dataBytes / 1024 ** 3} GB of memory`));
    assert.ok(intro.includes('](/privacy/)'));
});

// A visitor who picked the Turbo look back when the choice was stored.
function withStoredTurbo(check) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'turbo' } });
    try {
        check();
    } finally {
        if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
        else delete globalThis.localStorage;
    }
}

test('only the link a visit came with opens the Turbo look; every other visit opens the modern one', () => {
    withStoredTurbo(() => {
        assert.equal(readSkin(`?sample=hero&${SKIN_PARAM}=turbo`), 'turbo');
        assert.equal(readSkin('?sample=hero'), 'modern');
        assert.equal(readSkin(`?${SKIN_PARAM}=neon`), 'modern');
        assert.equal(readSkin(''), 'modern');
    });
});

test('the pre-paint script reads the look from the same parameter and stores nothing', () => {
    const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.ok(page.includes(`.get('${SKIN_PARAM}')`));
    assert.ok(!page.includes('crossbind.playground.skin'));
});

test('the hero shows the hero sample in the 66 characters its code column holds, its config declaring the sample\'s packages', () => {
    const { files, packages } = sampleProject('hero');
    [files['main.js'], files['native/greet.h'], files['native/math.rs'], HERO_CONFIG].join('\n').split('\n')
        .forEach((line) => assert.ok(line.length <= 66, line));
    packagesFor(packages).forEach(({ source, name, package: npm }) => assert.ok(HERO_CONFIG.includes(source === 'port' ? npm : `${name}:`), name));
});
