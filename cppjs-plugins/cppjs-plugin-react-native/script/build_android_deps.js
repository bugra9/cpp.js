import fs from 'node:fs';
import { state, buildDependencies, getDependenciesStamp, getTargetParams } from 'cpp.js';

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

// CMakeLists registers this file as CMAKE_CONFIGURE_DEPENDS: when the consumed
// rebuilt-dependency set changes, ninja re-runs the CMake configure on its own.
const stamp = getDependenciesStamp();
const stampFile = `${state.config.paths.cache}/deps-stamp`;
fs.mkdirSync(state.config.paths.cache, { recursive: true });
// Only on change: a fresh mtime would make ninja re-run the configure every build.
if (!fs.existsSync(stampFile) || fs.readFileSync(stampFile, 'utf8') !== stamp) {
    fs.writeFileSync(stampFile, stamp);
}
console.log(`CPPJS_DEPS_STAMP=${stamp}`);
