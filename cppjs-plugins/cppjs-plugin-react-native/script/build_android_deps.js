import { buildDependencies, getDependenciesStamp, getTargetParams } from 'cpp.js';

const buildType = (process.argv[2] || 'Release').toLowerCase();
const archs = (process.argv[3] || '').split(',').map((s) => s.trim()).filter(Boolean);

await buildDependencies({
    targetParams: getTargetParams({
        platform: ['android'],
        ...(archs.length > 0 ? { arch: archs } : {}),
        runtime: ['mt'],
        buildType: [buildType],
    }, true),
});

// Parsed by android/build.gradle and forwarded to CMake as -DCPPJS_DEPS_STAMP, so a change
// in the consumed rebuilt-dependency set invalidates AGP's cached CMake configure.
console.log(`CPPJS_DEPS_STAMP=${getDependenciesStamp()}`);
