import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { APP_LIST, PREVIEW_THEMES, previewOf } from '../../../landing/src/apps/appList.js';
import { RECORD_NAME } from '../build-example-demos.mjs';
import {
    assertAppPreviews,
    captureAppPreviews,
    missingPreviews,
    previewArea,
    previewsFingerprint,
    previewsRecord,
    previewsUpToDate,
} from '../capture-app-previews.mjs';

const EVERY_PICTURE = APP_LIST.flatMap((app) => PREVIEW_THEMES.map((theme) => previewOf(app.id, theme)));

function withDist(pictures, check) {
    const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-app-previews-'));
    try {
        for (const href of pictures) {
            const file = path.join(dist, href);
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, '');
        }
        check(dist);
    } finally {
        fs.rmSync(dist, { recursive: true, force: true });
    }
}

test('a tall output keeps its full width and is cut at the frame height', () => {
    assert.deepEqual(previewArea(1424, 2000, 712, 451), { width: 1424, height: 902, drawnHeight: 451 });
});

test('a short output is drawn whole at the same scale, and leaves the rest of the frame', () => {
    assert.deepEqual(previewArea(1424, 300, 712, 451), { width: 1424, height: 300, drawnHeight: 150 });
});

test('the gate passes a build with a picture of every app in both themes', () => {
    withDist(EVERY_PICTURE, (dist) => {
        assert.deepEqual(missingPreviews(dist), []);
        assert.equal(assertAppPreviews(dist), APP_LIST.length);
    });
});

test('the gate names a missing picture and the command that makes it', () => {
    const missing = previewOf(APP_LIST[0].id, 'dark');
    withDist(
        EVERY_PICTURE.filter((href) => href !== missing),
        (dist) => {
            assert.deepEqual(missingPreviews(dist), [missing]);
            assert.throws(() => assertAppPreviews(dist), {
                message: `app pictures are missing: ${missing}; run pnpm run previews before the build.`,
            });
        },
    );
});

test('a capture of an app that does not exist stops before it starts a browser', async () => {
    await assert.rejects(captureAppPreviews({ only: [APP_LIST[0].id, 'nope'] }), { message: 'there is no app nope.' });
});

test('the gate counts what it does not list', () => {
    withDist([], (dist) => {
        assert.throws(() => assertAppPreviews(dist), new RegExp(` and ${EVERY_PICTURE.length - 3} more; `));
    });
});

test('the pictures are kept while every one is there and their record names what they are taken from', () => {
    withDist(EVERY_PICTURE, (dist) => {
        assert.equal(previewsUpToDate('f', dist), false);
        fs.writeFileSync(previewsRecord(dist), JSON.stringify({ fingerprint: 'f' }));
        assert.equal(previewsUpToDate('f', dist), true);
        assert.equal(previewsUpToDate('g', dist), false);
        fs.rmSync(path.join(dist, EVERY_PICTURE[0]));
        assert.equal(previewsUpToDate('f', dist), false);
    });
});

test('the pictures follow the library modules the apps run, not the other demos', () => {
    const demos = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-app-previews-demos-'));
    const record = (id, crossbind) => {
        fs.mkdirSync(path.join(demos, id), { recursive: true });
        fs.writeFileSync(path.join(demos, id, RECORD_NAME), JSON.stringify({ fingerprint: 'f', demo: { id, crossbind } }));
    };
    try {
        record('lib-zstd', '2.0.0-beta.64');
        record('web-vanilla', '2.0.0-beta.64');
        const before = previewsFingerprint(demos);
        record('web-vanilla', '2.0.0-beta.65');
        assert.equal(previewsFingerprint(demos), before);
        record('lib-zstd', '2.0.0-beta.65');
        assert.notEqual(previewsFingerprint(demos), before);
    } finally {
        fs.rmSync(demos, { recursive: true, force: true });
    }
});
