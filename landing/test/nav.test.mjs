import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FEATURES, PLATFORM_MAP } from '../src/data.js';
import { findGuidePage, GUIDE_PAGES, guideHref } from '../src/guide/nav.js';

const headingIds = (page) => new Set(page.blocks.filter((block) => block.type === 'h2').map((block) => block.id));

test('the introduction is the guide index', () => {
    assert.equal(findGuidePage('/guide/')?.title, 'Introduction');
});

test('no two guide pages share a path', () => {
    const paths = GUIDE_PAGES.map((page) => page.path);
    assert.equal(new Set(paths).size, paths.length);
});

test('every guide link of the home map and the feature list names a page and one of its headings', () => {
    const rows = [PLATFORM_MAP.sources, PLATFORM_MAP.core, PLATFORM_MAP.outputs].flatMap((panel) => panel.rows);
    const targets = [...rows, ...FEATURES].filter((item) => item.guide !== undefined);

    for (const { guide, anchor } of targets) {
        const page = findGuidePage(guideHref(guide));
        assert.ok(page, `no guide page "${guide}"`);
        if (anchor) assert.ok(headingIds(page).has(anchor), `${guide} has no #${anchor}`);
    }
});
