const platformBuild = {
    'wasm': ['--enable-shared=no', '--host=x86_64-pc-linux-gnu'],
    // The bundled config.sub predates wasi; fake a known host to force
    // cross mode - the wasi CC decides the real target (same trick as wasm).
    'wasi': ['--enable-shared=no', '--host=x86_64-pc-linux-gnu'],
    'android-arm64-v8a': ['--enable-static=no', '--host=aarch64-linux-android'],
    'android-x86_64': ['--enable-static=no', '--host=x86_64-linux-android'],
    'ios-iphoneos': ['--enable-shared=no', '--host=arm-apple-darwin'],
    'ios-iphonesimulator': ['--enable-shared=no', '--host=x86_64-apple-darwin'],
};

const platformExtraLibs = {
    'wasm': ['-lsqlite3'],
    'android': ['-lstdc++'],
    'ios': ['-lc++'],
    // The bundled tools (geotifcp/listgeo) link C++ archives (proj) through
    // the C driver; wasi-clang needs the C++/EH runtime spelled out, and
    // -fwasm-exceptions at link selects the eh/ sysroot variant that has
    // libunwind (emcc does all of this implicitly on wasm).
    'wasi': ['-fwasm-exceptions', '-lc++', '-lc++abi', '-lunwind'],
};

const ifDep = (dep, params) => (dep ? params(dep) : []);

// Library packages ship archives only: drop the utilities (applygeo/geotifcp/listgeo) from the build.
const noToolsReplaceList = [
    {
        regex: 'SUBDIRS = libxtiff \\. bin man',
        replacement: 'SUBDIRS = libxtiff . man',
        paths: ['Makefile.in'],
    },
];

export default {
    sha256: 'c598d04fdf2ba25c4352844dafa81dde3f7fd968daa7ad131228cd91e9d3dc47', // libgeotiff-1.7.4.tar.gz
    getURL: (version) => `https://download.osgeo.org/geotiff/libgeotiff/libgeotiff-${version}.tar.gz`,
    buildType: 'configure',
    sourceReplaceList: () => noToolsReplaceList,
    getBuildParams: (target, depPaths) => [
        ...(platformBuild[target.platform] || platformBuild[`${target.platform}-${target.arch}`] || []),
        ...ifDep(depPaths.proj, (d) => [`--with-proj=${d.root}`]),
        ...ifDep(depPaths.tiff, (d) => [`--with-libtiff=${d.root}`]),
        ...ifDep(depPaths.z, (d) => [`--with-zlib=${d.root}`]),
        ...ifDep(depPaths.jpeg, (d) => [`--with-jpeg=${d.root}`]),
    ],
    getExtraLibs: (target) => platformExtraLibs[target.platform] || [],
    replaceList: [
        {
            regex: 'double GTIFAtof\\(const char',
            replacement: 'double GTIFAtof2(const char',
            paths: ['geo_strtod.c'],
        },
    ],
};
