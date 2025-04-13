import fs from 'node:fs';
import upath from 'upath';
import { execFileSync } from 'node:child_process';
import state from '../state/index.js';

const iOSDevPath = '/Applications/Xcode.app/Contents/Developer';
const iosBinPath = `${iOSDevPath}/Toolchains/XcodeDefault.xctoolchain/usr/bin`;
const iosRanLibBin = `${iosBinPath}/ranlib`;

export default function createXCFramework(overrideConfig = null) {
    if (process.platform !== 'darwin') {
        return;
    }

    const output = overrideConfig?.paths?.output || state.config.paths.output;
    const projectPath = overrideConfig?.paths?.project || state.config.paths.project;
    const libName = overrideConfig?.export?.libName || state.config.export.libName;

    if (
        !fs.existsSync(`${output}/prebuilt/iOS-iphoneos/lib`)
        || !fs.existsSync(`${output}/prebuilt/iOS-iphonesimulator/lib`)
    ) return;

    const options = {
        cwd: projectPath,
        stdio: 'inherit',
    };

    const relativeOutput = upath.relative(projectPath, output);

    libName.forEach((fileName) => {
        if (!fs.existsSync(`${projectPath}/${fileName}.xcframework`)) {
            execFileSync(iosRanLibBin, [`${relativeOutput}/prebuilt/iOS-iphoneos/lib/lib${fileName}.a`], options);
            execFileSync(iosRanLibBin, [`${relativeOutput}/prebuilt/iOS-iphonesimulator/lib/lib${fileName}.a`], options);
            const params = [
                '-create-xcframework',
                '-library', `${relativeOutput}/prebuilt/iOS-iphoneos/lib/lib${fileName}.a`,
                '-headers', `${relativeOutput}/prebuilt/iOS-iphoneos/include`,
                '-library', `${relativeOutput}/prebuilt/iOS-iphonesimulator/lib/lib${fileName}.a`,
                '-headers', `${relativeOutput}/prebuilt/iOS-iphonesimulator/include`,
                '-output', `${fileName}.xcframework`,
            ];
            execFileSync('xcodebuild', params, options);
        }

        if (!fs.existsSync(`${output}/prebuilt/${fileName}.xcframework.zip`)) {
            execFileSync('zip', ['-y', '-r', `${relativeOutput}/prebuilt/${fileName}.xcframework.zip`, `${fileName}.xcframework`], options);
        }
    });
}
