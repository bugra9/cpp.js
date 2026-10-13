import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PORTS } from '../src/ports/catalog.js';
import { PORT_PAGES } from '../src/ports/pages.js';

const published = new Set(
    PORTS.flatMap((port) => [port.published ? port.npm : null, ...port.targets.filter((target) => target.published).map((target) => target.package)]).filter(Boolean),
);

const flatten = (blocks) =>
    blocks.flatMap((block) => (block.type === 'tabs' ? block.tabs.flatMap((tab) => flatten(tab.blocks)) : block.type === 'details' ? flatten(block.blocks) : [block]));

const textOf = (block) => block.code ?? block.text ?? (block.rows ?? []).flat().join(' ');

test('every library package the install tabs name is published on the release channel', () => {
    for (const page of PORT_PAGES) {
        const install = page.blocks.filter((block) => block.type === 'tabs');
        const named = flatten(install).map(textOf).join('\n').match(/@crossbind\/port-[a-z0-9-]+/g) ?? [];
        assert.ok(named.length, `${page.title}: the install tabs name no package`);
        for (const name of named) assert.ok(published.has(name), `${page.title}: ${name} is not published`);
    }
});
