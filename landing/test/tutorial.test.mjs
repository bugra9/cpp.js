import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMOS, sampleProject } from '../../scripts/site/build-example-demos.mjs';
import { searchGuide } from '../src/guide/search.js';
import { TUTORIAL_PAGES } from '../src/pages/tutorial.js';
import { SITE_ROUTES } from '../src/site-pages.js';

test('every tutorial step is a page of the site, so it is prerendered and in the sitemap', () => {
    for (const page of TUTORIAL_PAGES) assert.ok(SITE_ROUTES.includes(page.href), page.href);
});

test('every tutorial step runs a sample that the demo build prebuilds', () => {
    const prebuilt = new Set(DEMOS.filter((demo) => demo.kind === 'sample').map((demo) => demo.id));
    for (const page of TUTORIAL_PAGES) assert.ok(prebuilt.has(`sample-${page.sample}`), page.sample);
});

test('a step that opens on another file than its header opens on one of its sample\'s files', () => {
    for (const page of TUTORIAL_PAGES.filter((step) => step.open)) assert.ok(page.open in sampleProject(page.sample).files, page.sample);
});

test('searching for the tutorial and a step\'s topic finds that step', () => {
    for (const page of TUTORIAL_PAGES) {
        assert.ok(searchGuide(`tutorial ${page.title}`).some((entry) => entry.href === page.href), page.href);
    }
});
