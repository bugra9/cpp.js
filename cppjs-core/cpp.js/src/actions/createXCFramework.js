import fs from 'node:fs';
import upath from 'upath';
import { execFileSync } from 'node:child_process';
import state from '../state/index.js';
import { getTargetParams, getFilteredBuildTargets } from './target.js';

const iOSDevPath = '/Applications/Xcode.app/Contents/Developer';
const iosBinPath = `${iOSDevPath}/Toolchains/XcodeDefault.xctoolchain/usr/bin`;
const iosRanLibBin = `${iosBinPath}/ranlib`;

export default function createXCFramework(overrideConfig = null) {
    if (process.platform !== 'darwin') {
        console.log('XCFramework not created because platform is not darwin.');
        return;
    }

    const output = overrideConfig?.paths?.output || state.config.paths.output;
    const projectPath = overrideConfig?.paths?.project || state.config.paths.project;
    const libName = overrideConfig?.export?.libName || state.config.export.libName;

    const options = {
        cwd: projectPath,
        stdio: 'inherit',
    };

    const relativeOutput = upath.relative(projectPath, output);

    const targetParams = overrideConfig?.targetParams || getTargetParams();
    const buildTargets = getFilteredBuildTargets(targetParams, { platform: 'ios', runtime: 'mt', buildType: (targetParams.buildType && targetParams.buildType.length > 0) ? targetParams.buildType[0] : 'release' });

    if (buildTargets.some(t => !fs.existsSync(`${output}/prebuilt/${t.path}/lib`))) {
        console.log('XCFramework not created because some of the build targets are not built.');
        return;
    }

    const targets = {};
    buildTargets.forEach((target) => {
        const p = `${target.platform}-${target.runtime}-${target.buildType}`;
        if (!targets[p]) {
            targets[p] = {};
        }
        targets[p][target.arch] = target;
    });

    libName.forEach((fileName) => {
        Object.values(targets).forEach((a) => {
            const targets = Object.values(a);
            // const targetName = `${fileName}-${targets[0].runtime}-${targets[0].buildType}.xcframework`;
            const targetName = `${fileName}.xcframework`;
            const targetPath = `${projectPath}/${targetName}`;
            // Always recreate: the xcframework wraps the freshly built static libs which contain
            // the user's bridge bindings. If we keep a stale xcframework around, the linker
            // (via the podspec's vendored_frameworks + force_load) will pull in old bindings
            // and runtime calls like `Module.<UserClass>` resolve to undefined. xcodebuild
            // -create-xcframework refuses to overwrite, so delete first.
            if (fs.existsSync(targetPath)) {
                fs.rmSync(targetPath, { recursive: true, force: true });
            }
            console.log(`Creating XCFramework ${targetName}`);
            const params = ['-create-xcframework'];
            targets.forEach((target) => {
                execFileSync(iosRanLibBin, [`${relativeOutput}/prebuilt/${target.path}/lib/lib${fileName}.a`], options);
                params.push(
                    '-library', `${relativeOutput}/prebuilt/${target.path}/lib/lib${fileName}.a`,
                    '-headers', `${relativeOutput}/prebuilt/${target.path}/include`,
                );
            });
            params.push('-output', targetName);
            execFileSync('xcodebuild', params, options);
            console.log(`XCFramework ${targetName} created.`);
        });
    });
}
