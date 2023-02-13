import glob from 'glob';
import os from "os";
import { execFileSync } from 'child_process';
import pullDockerImage from './pullDockerImage.js';
import { getBaseInfo, getPathInfo, getOsUserAndGroupId } from './utils.js';

export default function createBridge(filePath, outputPath, basePath = process.cwd()) {
    pullDockerImage();

    const input = getPathInfo(filePath, basePath);
    const output = getPathInfo(outputPath, basePath);
    const projectPath = getPathInfo(process.cwd(), basePath);
    const base = getBaseInfo(basePath);

    const includePath = [
        glob.sync("node_modules/cppjs-lib-*-web/include", { absolute: false }),
        glob.sync("native", { absolute: false }),
        glob.sync("src/native", { absolute: false }),
    ].filter(path => !!path.toString()).map(path => `-I/live/${projectPath.relative}/${path}`);

    const options = { cwd: outputPath, stdio : 'pipe' };
    const args = [
        "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "bugra9/cpp.js",
        "swig", "-c++", '-emscripten', '-o', `/live/${output.relative}/${filePath.split('/').at(-1)}.cpp`, ...includePath, `/live/${input.relative}`
    ];
    execFileSync("docker", args, options);
    return `${base.withSlash}${output.relative}/${filePath.split('/').at(-1)}.cpp`;
}
