// The playground's samples in picker order, their files in samples/<id>/. A sample with no native files runs the
// compiler template's, on which the image warms its build. Plain data, so the demo build reads it too.
export const SAMPLE_LIST = Object.freeze([
    { id: 'hello', title: 'Functions and classes', packages: [] },
    { id: 'numbers', title: 'Numbers and BigInt', packages: [] },
    { id: 'strings', title: 'Strings and vectors', packages: [] },
    { id: 'structs', title: 'Structs and enums', packages: [] },
    { id: 'inheritance', title: 'Inheritance', packages: [] },
    { id: 'callbacks', title: 'Callbacks', packages: [] },
    { id: 'errors', title: 'Exceptions', packages: [] },
].map((sample) => Object.freeze({ ...sample, packages: Object.freeze(sample.packages) })));
