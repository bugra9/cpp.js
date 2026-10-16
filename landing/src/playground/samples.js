// The compiler template's C++: its image warms the build tree on these very files, so the hello sample, which has
// no C++ of its own, compiles once and then comes from the cache.
import header from '../../../tooling/cloud/compiler/template/src/native/native.h?raw';
import source from '../../../tooling/cloud/compiler/template/src/native/native.cpp?raw';
import { SAMPLE_LIST } from './sampleList.js';

const TEMPLATE_NATIVE = Object.freeze({ 'native/native.h': header, 'native/native.cpp': source });
const FILES = import.meta.glob('./samples/*/**/*', { query: '?raw', import: 'default', eager: true });

// A sample without native files of its own uses the template's, as the demo build does (scripts/site/build-example-demos.mjs).
function filesOf(id) {
    const prefix = `./samples/${id}/`;
    const own = Object.fromEntries(Object.entries(FILES)
        .filter(([path]) => path.startsWith(prefix))
        .map(([path, text]) => [path.slice(prefix.length), text]));
    const hasNative = Object.keys(own).some((name) => name.startsWith('native/'));
    return Object.freeze(hasNative ? own : { ...own, ...TEMPLATE_NATIVE });
}

export const SAMPLES = Object.freeze(SAMPLE_LIST.map(({ id, title, packages }) => Object.freeze({
    id,
    title,
    project: Object.freeze({ files: filesOf(id), packages }),
})));

export const DEFAULT_SAMPLE = SAMPLES[0];

export const findSample = (id) => SAMPLES.find((candidate) => candidate.id === id);
