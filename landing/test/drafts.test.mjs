import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editDraft, overlayOf, parseDrafts } from '../src/playground/drafts.js';

const SAMPLES = [
    { id: 'hello', files: { 'native.h': 'h', 'native.cpp': 'cpp', 'main.js': 'js' } },
    { id: 'numbers', files: { 'native.h': 'nh', 'native.cpp': 'ncpp', 'main.js': 'njs' } },
];
const [HELLO] = SAMPLES;

test('a draft keeps only the files that differ from its sample', () => {
    assert.deepEqual(overlayOf({ 'native.h': 'h', 'main.js': 'edited' }, HELLO.files), { 'main.js': 'edited' });
});

test('a draft saved before there were samples becomes the first sample\'s, down to its edited files', () => {
    const parsed = parseDrafts({ 'native.h': 'h', 'native.cpp': 'cpp', 'main.js': 'edited' }, SAMPLES);
    assert.deepEqual(parsed, { sample: 'hello', drafts: { hello: { 'main.js': 'edited' } } });
});

test('drafts of unknown samples, unknown files and values that are not text are dropped', () => {
    const stored = { sample: 'gone', drafts: { gone: { 'main.js': 'x' }, numbers: { 'main.js': 1, 'notes.txt': 'x', 'native.h': 'changed' } } };
    assert.deepEqual(parseDrafts(stored, SAMPLES), { sample: undefined, drafts: { numbers: { 'native.h': 'changed' } } });
});

test('anything stored that is not a set of drafts gives none', () => {
    for (const stored of [null, 42, 'text', [], { drafts: 'x' }]) {
        assert.deepEqual(parseDrafts(stored, SAMPLES), { sample: undefined, drafts: {} });
    }
});

test('undoing the last change removes the draft', () => {
    const edited = editDraft({}, HELLO, 'main.js', 'edited');
    assert.deepEqual(edited, { hello: { 'main.js': 'edited' } });
    assert.deepEqual(editDraft(edited, HELLO, 'main.js', 'js'), {});
});

test('an edit leaves the other samples\' drafts alone', () => {
    const drafts = { numbers: { 'main.js': 'kept' } };
    assert.deepEqual(editDraft(drafts, HELLO, 'native.h', 'changed'), { numbers: { 'main.js': 'kept' }, hello: { 'native.h': 'changed' } });
});
