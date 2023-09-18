import { execFileSync } from 'child_process';
import glob from 'glob';
import pullDockerImage, { getDockerImage } from '../utils/pullDockerImage.js';
import getBaseInfo from '../utils/getBaseInfo.js';
import getPathInfo from '../utils/getPathInfo.js';
import getOsUserAndGroupId from '../utils/getOsUserAndGroupId.js';
import { getCliCMakeListsFile } from '../utils/findCMakeListsFile.js'

export default function createWasm(compiler, options = {}) {
    const compiler2 = new CppjsCompiler(
        compiler.config,
        options,
    );
    return compiler2.compileToWasm();
}

export function getCmakeParams(compiler, options = {}) {
    const compiler2 = new CppjsCompiler(
        compiler.config,
        options,
    );

    compiler2.prepare();
    return compiler2.getCmakeParams(compiler.config.general.name, true, true);
}

function setPath(arr, dependency, type, filter = () => {}) {
    if (filter(dependency)) {
        if (type === 'this') {
            arr.push(dependency);
        } else if (Array.isArray(dependency.paths[type])) {
            arr.push(...dependency.paths[type]);
        } else {
            arr.push(dependency.paths[type]);
        }
    }

    dependency.dependencies.forEach(dep => {
        setPath(arr, dep, type, filter);
    });
}

function getParentPath(path) {
    const pathArray = path.split('/');
    pathArray.pop();
    return pathArray.join('/');
}


class CppjsCompiler {
    constructor(config, options) {
        this.config = config;
        this.options = options;
        this.pathType = 'absolute';
        this.pathPrefix = '';
    }

    getPath(path) {
        if (this.pathType === 'absolute') {
            return getPathInfo(path, this.config.paths.base).absolute;
        } else if (this.pathType === 'relative') {
            return `${this.pathPrefix}${getPathInfo(path, this.config.paths.base).relative}`
        }

        return '';
    }

    compileToWasm() {
        pullDockerImage();

        this.pathType = 'relative';
        this.pathPrefix = '/live/';

        this.prepare();
        this.cmake(this.config.general.name, true, false);
        this.make();
        this.cmake(this.config.general.name+'bridge', false, true);
        this.make();

        const dependLibs = [
            ...glob.sync(`${this.config.paths.temp}/dependencies/**/*.a`, { absolute: true, cwd: this.config.paths.project }),
        ];
        this.cmakeDepends.forEach((d) => {
            dependLibs.push(...glob.sync(`${d.paths.output}/prebuilt/Emscripten-x86_64/**/*.a`, { absolute: true, cwd: d.paths.project }));
        });

        this.libs = [
            `${this.config.paths.temp}/lib${this.config.general.name}.a`,
            `${this.config.paths.temp}/lib${this.config.general.name}bridge.a`,
            ...dependLibs,
        ].filter(path => !!path.toString()).map(path => this.getPath(path));

        this.cc();

        return this.config.paths.temp;
    }

    prepare() {
        const sourceFilter = (d) => d === this.config || d.export.type === 'source';
        this.headerPathWithDepends = [];
        setPath(this.headerPathWithDepends, this.config, 'header', sourceFilter);
        this.headerPathWithDepends = this.headerPathWithDepends.map(p => this.getPath(p)).join(';');

        this.headerGlob = [];
        this.headerPathWithDepends.split(';').forEach(h => {
            this.config.ext.header.forEach(ext => {
                this.headerGlob.push(`${h}/*.${ext}`);
            });
        });


        this.nativePathWithDepends = [];
        setPath(this.nativePathWithDepends, this.config, 'native', sourceFilter);
        this.nativePathWithDepends = this.nativePathWithDepends.map(p => this.getPath(p)).join(';');

        this.nativeGlob = [];
        this.nativePathWithDepends.split(';').forEach(h => {
            this.config.ext.source.forEach(ext => {
                this.nativeGlob.push(`${h}/*.${ext}`);
            });
        });

        const cliCMakeListsFile = getCliCMakeListsFile();
        const cmakeFilter = (d) => d !== this.config && d.export.type === 'cmake' && d.paths.cmake !== cliCMakeListsFile;
        this.cmakeDepends = [];
        setPath(this.cmakeDepends, this.config, 'this', cmakeFilter);

        this.pathsOfCmakeDepends = this.cmakeDepends
            .map(d => getParentPath(d.paths.cmake))
            .map(p => this.getPath(p)).join(';');
        this.nameOfCmakeDepends = this.cmakeDepends.map(d => d.general.name).join(';');
    }

    getCmakeParams(name, isBuildSource, isBuildBridge) {
        const params = [];
        if (isBuildSource) params.push('-DBUILD_SOURCE=TRUE');
        if (isBuildBridge) params.push('-DBUILD_BRIDGE=TRUE');

        const output = this.getPath(this.config.paths.temp);
        const projectPath = this.getPath(process.cwd());

        params.push(...[
            `-DBASE_DIR=${projectPath}`,
            `-DNATIVE_GLOB=${this.nativeGlob.join(';')}`,
            `-DHEADER_GLOB=${this.headerGlob.join(';')}`,
            `-DHEADER_DIR=${this.headerPathWithDepends}`,
            `-DDEPENDS_CMAKE_PATHS=${this.pathsOfCmakeDepends}`,
            `-DDEPENDS_CMAKE_NAMES=${this.nameOfCmakeDepends}`,
            `-DBRIDGE_DIR=${output}/bridge`,
        ]);

        return params;
    }

    cmake(name, isBuildSource, isBuildBridge) {
        const params = this.getCmakeParams(name, isBuildSource, isBuildBridge);

        const output = this.getPath(this.config.paths.temp);
        const base = getBaseInfo(this.config.paths.base);

        const cMakeParentPath = getParentPath(this.config.paths.cmake);

        const args = [
            "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "-v", `${cMakeParentPath}:/cmake`, "--workdir", `${output}`, getDockerImage(),
            "emcmake", "cmake", "/cmake", '-DCMAKE_BUILD_TYPE=Release', '-DBUILD_TYPE=STATIC', `-DCMAKE_INSTALL_PREFIX=${output}`, `-DPROJECT_NAME=${name}`, ...params,
        ];
        const options = { cwd: this.config.paths.temp, stdio : 'pipe' };
        execFileSync("docker", args, options);
        return this.config.paths.temp;
    }

    make() {
        const output = this.getPath(this.config.paths.temp);
        const base = getBaseInfo(this.config.paths.base);

        let cMakeParentPath = this.config.paths.cmake.split('/');
        cMakeParentPath.pop();
        cMakeParentPath = cMakeParentPath.join('/');
        const args = [
            "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "-v", `${cMakeParentPath}:/cmake`, "--workdir", `${output}`, getDockerImage(),
            "emmake", "make", "install"
        ];
        const options = { cwd: this.config.paths.temp, stdio : 'pipe' };
        execFileSync("docker", args, options);
        return this.config.paths.temp;
    }

    cc() {
        const output = this.getPath(this.config.paths.temp);
        const base = getBaseInfo(this.config.paths.base);
        const args = [
            "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "-v", `${this.config.paths.cli}:/cli`, getDockerImage(),
            "emcc", "-lembind", "-Wl,--whole-archive", ...this.libs, ...(this.options.cc || []), "-s", "WASM=1", "-s", "MODULARIZE=1", '-o', `${output}/${this.config.general.name}.js`, '--extern-post-js', '/cli/assets/extern-post.js'
        ];
        const options = { cwd: this.config.paths.temp, stdio : 'pipe' };
        execFileSync("docker", args, options);
        return this.config.paths.temp;
    }
}
