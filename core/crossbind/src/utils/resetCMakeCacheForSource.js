import fs from 'node:fs';
import state from '../state/index.js';
import replaceBasePathForDocker from './replaceBasePathForDocker.js';
import { isLocalRunner } from './selectRunner.js';
import { HOST_BUILT_PLATFORMS } from './targets.js';

const normalize = (dir) => dir.replaceAll('\\', '/').replace(/\/+$/, '');

// The directory as the cmake run() starts sees it: a container, Docker or a remote runner, has the project at
// DOCKER_BASE; macOS and iOS builds and the LOCAL runner see this machine's paths.
function seenByCMake(dir, target) {
    const isLocal = HOST_BUILT_PLATFORMS.includes(target.platform) || isLocalRunner(state.config.system);
    return isLocal ? dir : replaceBasePathForDocker(dir, state.config.paths.base);
}

// A CMake build tree remembers the source directory it was configured from and refuses another one. The CMake
// projects crossbind ships move with its version (node_modules/.pnpm/crossbind@<version>/...), so a tree configured
// from another directory starts afresh, as `cmake --fresh` would.
export default function resetCMakeCacheForSource(buildPath, sourceDir, target) {
    const cache = `${buildPath}/CMakeCache.txt`;
    if (!fs.existsSync(cache)) return;
    const configuredFrom = fs.readFileSync(cache, 'utf8').match(/^CMAKE_HOME_DIRECTORY:INTERNAL=(.*)$/m)?.[1];
    if (configuredFrom !== undefined && normalize(configuredFrom) === normalize(seenByCMake(sourceDir, target))) return;
    fs.rmSync(cache, { force: true });
    fs.rmSync(`${buildPath}/CMakeFiles`, { recursive: true, force: true });
}
