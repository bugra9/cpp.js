import assert from 'node:assert/strict';
import test from 'node:test';
import { renameInReadme } from '../src/readme.js';

test('a scaffolded library README names its own package and installs it from the default tag', () => {
    const readme = [
        '# @crossbind/example-lib-source',
        '<a href="https://www.npmjs.com/package/@crossbind/example-lib-source">',
        '    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/example-lib-source/beta?style=for-the-badge" />',
        'npm install @crossbind/example-lib-source@beta',
        "+import sourceSample from '@crossbind/example-lib-source/crossbind.config.js';",
        '',
    ].join('\n');

    const renamed = renameInReadme(readme, '@crossbind/example-lib-source', 'crossbind-lib-my-lib');

    assert.equal(renamed, [
        '# crossbind-lib-my-lib',
        '<a href="https://www.npmjs.com/package/crossbind-lib-my-lib">',
        '    <img alt="NPM version" src="https://img.shields.io/npm/v/crossbind-lib-my-lib?style=for-the-badge" />',
        'npm install crossbind-lib-my-lib',
        "+import sourceSample from 'crossbind-lib-my-lib/crossbind.config.js';",
        '',
    ].join('\n'));
});

test('a package whose name only starts with the template name keeps its name', () => {
    const readme = 'npm install @crossbind/example-lib-prebuilt-matrix-node@beta';

    assert.equal(renameInReadme(readme, '@crossbind/example-lib-prebuilt-matrix', 'crossbind-lib-my-lib'), readme);
});
