// The compiler template's C++: its image warms the build tree on these very files, so the hello sample, which has
// no C++ of its own, compiles once and then comes from the cache.
import header from '../../../tooling/cloud/compiler/template/src/native/native.h?raw';
import source from '../../../tooling/cloud/compiler/template/src/native/native.cpp?raw';

const TEMPLATE = Object.freeze({ 'native.h': header, 'native.cpp': source });
const FILES = import.meta.glob('./samples/*/*', { query: '?raw', import: 'default', eager: true });

// A sample without C++ of its own uses the template's, as the demo build does (scripts/site/build-example-demos.mjs).
function sample(id, title) {
    const file = (name) => FILES[`./samples/${id}/${name}`] ?? TEMPLATE[name];
    return Object.freeze({ id, title, files: Object.freeze({ 'native.h': file('native.h'), 'native.cpp': file('native.cpp'), 'main.js': file('main.js') }) });
}

export const SAMPLES = Object.freeze([
    sample('hello', 'Functions and classes'),
    sample('numbers', 'Numbers and BigInt'),
    sample('strings', 'Strings and vectors'),
    sample('structs', 'Structs and enums'),
    sample('inheritance', 'Inheritance'),
    sample('callbacks', 'Callbacks'),
    sample('errors', 'Exceptions'),
]);

export const DEFAULT_SAMPLE = SAMPLES[0];

export const findSample = (id) => SAMPLES.find((candidate) => candidate.id === id);
