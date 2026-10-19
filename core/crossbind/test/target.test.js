import { describe, expect, test, vi } from 'vitest';
import { TARGETS } from '../src/utils/targets.js';

const state = { config: { target: {} }, targets: TARGETS };
vi.mock('../src/state/index.js', () => ({ default: state }));

const { getBuildTargets } = await import('../src/actions/target.js');

describe('getBuildTargets', () => {
    // React Native's iOS build and the Conan xcframeworks look targets up this way.
    test('finds the archives\' iOS targets alone when the lookup names no runtime environment', () => {
        const ios = getBuildTargets({ platform: ['ios'], arch: ['iphoneos', 'iphonesimulator'], runtime: ['mt'], buildType: ['release'] });
        expect(ios.map((target) => target.arch)).toEqual(['iphoneos', 'iphonesimulator']);
        expect(ios.every((target) => target.runtimeEnv === undefined)).toBe(true);
    });

    test('finds an iOS app\'s targets beside the archives\' when the lookup names the app', () => {
        const ios = getBuildTargets({ platform: ['ios'], arch: ['iphoneos'], runtime: ['mt'], buildType: ['release'], runtimeEnv: ['app'] });
        expect(ios.map((target) => target.runtimeEnv)).toEqual([undefined, 'app']);
    });
});
