const platformBuild = {
    'wasm': ['--enable-shared=no', '--host=wasm32-unknown-emscripten'],
};

export default {
    getURL: (version) => `https://ftp.gnu.org/pub/gnu/libiconv/libiconv-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: (target) => [
        ...(platformBuild[target.platform] || []),
    ],
};
