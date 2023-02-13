import { execFileSync } from 'child_process';
import * as url from 'node:url';
import pullDockerImage from './pullDockerImage.js';
import { getBaseInfo, getPathInfo, getOsUserAndGroupId } from './utils.js';

const __filename = url.fileURLToPath(import.meta.url);
const temp = __filename.split('/');
temp.pop();
temp.pop();
const __dirname = temp.join('/');

export default function createWasm(cMakeFilePath, outputPath, tempPath, options = {}, basePath = process.cwd()) {
    pullDockerImage();
    cmake(cMakeFilePath, tempPath, basePath);
    make(cMakeFilePath, tempPath, basePath);
    cc(tempPath, outputPath, options.cc, basePath);

    return outputPath;
}

function cmake(cMakeFilePath, outputPath, basePath) {
    const output = getPathInfo(outputPath, basePath);
    const projectPath = getPathInfo(process.cwd(), basePath);
    const base = getBaseInfo(basePath);

    let cMakeParentPath = cMakeFilePath.split('/');
    cMakeParentPath.pop();
    cMakeParentPath = cMakeParentPath.join('/');
    const args = [
        "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "-v", `${cMakeParentPath}:/cmake`, "--workdir", `/live/${output.relative}`, "bugra9/cpp.js",
        "emcmake", "cmake", "/cmake", `-DBASE_DIR=/live/${projectPath.relative}`,
        `-DCMAKE_INSTALL_PREFIX=/live/${output.relative}`, `-DBRIDGE_DIR=/live/${output.relative}`,
    ];
    const options = { cwd: outputPath, stdio : 'pipe' };
    execFileSync("docker", args, options);
    return outputPath;
}

function make(cMakeFilePath, outputPath, basePath) {
    const output = getPathInfo(outputPath, basePath);
    const base = getBaseInfo(basePath);

    let cMakeParentPath = cMakeFilePath.split('/');
    cMakeParentPath.pop();
    cMakeParentPath = cMakeParentPath.join('/');
    const args = [
        "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "-v", `${cMakeParentPath}:/cmake`, "--workdir", `/live/${output.relative}`, "bugra9/cpp.js",
        "emmake", "make"
    ];
    const options = { cwd: outputPath, stdio : 'pipe' };
    execFileSync("docker", args, options);
    return outputPath;
}

function cc(tempPath, outputPath, flags = [], basePath) {
    const input = getPathInfo(tempPath, basePath);
    const output = getPathInfo(outputPath, basePath);
    const base = getBaseInfo(basePath);
    const args = [
        "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "-v", `${__dirname}:/cli`, "bugra9/cpp.js",
        "emcc", "-lembind", "-Wl,--whole-archive", `/live/${input.relative}/libcppjs.a`, ...flags, "-s", "WASM=1", "-s", "MODULARIZE=1", '-o', `/live/${output.relative}/cpp.js`, '--extern-post-js', '/cli/src/extern-post.js'
    ];
    const options = { cwd: tempPath, stdio : 'pipe' };
    execFileSync("docker", args, options);
    return outputPath;
}
