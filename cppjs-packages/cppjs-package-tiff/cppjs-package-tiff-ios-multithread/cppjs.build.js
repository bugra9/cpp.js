export default {
    getURL: (version) => `https://download.osgeo.org/libtiff/tiff-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: () => [
        '-Dtiff-tools=OFF', '-Dtiff-tests=OFF', '-Dtiff-contrib=OFF',
        '-Dtiff-docs=OFF', '-Dld-version-script=OFF',
    ],
};
