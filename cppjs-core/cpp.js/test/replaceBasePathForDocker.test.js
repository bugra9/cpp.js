import { describe, test, expect } from 'vitest';
import replaceBasePathForDocker from '../src/utils/replaceBasePathForDocker.js';

const BASE = '/Users/dev/project';

describe('replaceBasePathForDocker', () => {
    test('replaces every occurrence of the base path in a string', () => {
        expect(replaceBasePathForDocker(`${BASE}/a:${BASE}/b`, BASE))
            .toBe('/tmp/cppjs/live/a:/tmp/cppjs/live/b');
    });

    test('maps arrays recursively', () => {
        expect(replaceBasePathForDocker(['-v', `${BASE}/x`, 7], BASE))
            .toEqual(['-v', '/tmp/cppjs/live/x', 7]);
    });

    test('maps object values recursively without mutating the input', () => {
        const input = { cwd: `${BASE}/build`, nested: { out: `${BASE}/dist` } };

        const result = replaceBasePathForDocker(input, BASE);

        expect(result).toEqual({ cwd: '/tmp/cppjs/live/build', nested: { out: '/tmp/cppjs/live/dist' } });
        expect(input.cwd).toBe(`${BASE}/build`);
    });

    test('passes through null and non-string primitives', () => {
        expect(replaceBasePathForDocker(null, BASE)).toBeNull();
        expect(replaceBasePathForDocker(42, BASE)).toBe(42);
        expect(replaceBasePathForDocker(undefined, BASE)).toBeUndefined();
    });
});
