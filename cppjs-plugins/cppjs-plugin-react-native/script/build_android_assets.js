import fs from 'node:fs';
import { state, getData, getDependenciesStamp } from 'cpp.js';
import resolveBuildTarget from './resolveBuildTarget.js';

const arch = process.argv[2] || 'arm64-v8a';
const buildType = process.argv[3] || 'Release';

const buildTarget = resolveBuildTarget(arch, buildType);

const androidAssetPath = `${state.config.paths.project}/android/app/src/main/assets/cppjs`;
const stampPath = `${androidAssetPath}/.cppjs-assets-stamp`;
const stamp = getDependenciesStamp();

// Copies below are existsSync-guarded, so data from a source-rebuilt dependency
// (e.g. an overridden PROJ's proj.db) would stay stale forever: wipe and recopy
// whenever the consumed rebuilt-dependency set changes.
const previousStamp = fs.existsSync(stampPath) ? fs.readFileSync(stampPath, 'utf8') : null;
if (previousStamp !== null && previousStamp !== stamp) {
    fs.rmSync(androidAssetPath, { recursive: true, force: true });
}

if (!fs.existsSync(androidAssetPath)) {
    fs.mkdirSync(androidAssetPath, { recursive: true });
}
Object.entries(getData('data', buildTarget)).forEach(([key, value]) => {
    if (fs.existsSync(key)) {
        const dAssetPath = `${androidAssetPath}/${value}`;
        if (!fs.existsSync(dAssetPath)) {
            fs.mkdirSync(dAssetPath, { recursive: true });
            fs.cpSync(key, dAssetPath, { recursive: true });
        }
    }
});
fs.writeFileSync(stampPath, stamp);
