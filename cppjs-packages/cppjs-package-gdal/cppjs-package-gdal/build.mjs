const platformCmake = {
    'wasm': ['-DBUILD_SHARED_LIBS=OFF'],
    'android': ['-DCMAKE_ANDROID_STL_TYPE=c++_shared', '-DCMAKE_DISABLE_FIND_PACKAGE_Python=ON', '-DBUILD_PYTHON_BINDINGS=OFF'],
};

const ifDep = (dep, params) => (dep ? params(dep) : []);

export default {
    sha256: 'e04e9813bd215b56753d5554330c53be25f3df2d7ed7e6413a19e6b66751c675', // gdal-3.13.1.tar.gz
    getURL: (version) => `https://github.com/OSGeo/gdal/releases/download/v${version}/gdal-${version}.tar.gz`,
    copyToSource: { 'assets/gdal_empty_file.cpp': 'gcore/gdal_empty_file.cpp' },
    replaceList: [
        {
            regex: ' iconv_open',
            replacement: ' libiconv_open',
            paths: ['port/cpl_recode_iconv.cpp'],
        },
        {
            regex: '        iconv',
            replacement: '        libiconv',
            paths: ['port/cpl_recode_iconv.cpp'],
        },
        {
            regex: '#include <iconv.h>',
            replacement: '# include <iconv.h>\nextern "C" {\n    extern __attribute__((__visibility__("default"))) iconv_t libiconv_open (const char* tocode, const char* fromcode);\n    extern __attribute__((__visibility__("default"))) size_t libiconv (iconv_t cd,  ICONV_CPP_CONST char* * inbuf, size_t *inbytesleft, char* * outbuf, size_t *outbytesleft);\n}',
            paths: ['port/cpl_recode_iconv.cpp'],
        },
        {
            regex: '  add_subdirectory\\(swig\\)',
            replacement: '',
            paths: ['gdal.cmake'],
        },
        {
            regex: 'add_library\\(\\$\\{GDAL_LIB_TARGET_NAME\\} gcore/gdal.h\\)',
            replacement: 'add_library(${GDAL_LIB_TARGET_NAME} gcore/gdal.h gcore/gdal_empty_file.cpp)',
            paths: ['gdal.cmake'],
        },
    ],
    buildType: 'cmake',
    getBuildParams: (target, depPaths) => [
        ...(platformCmake[target.platform] || []),
        '-DBUILD_APPS=OFF', '-DBUILD_TESTING=OFF', '-DACCEPT_MISSING_SQLITE3_MUTEX_ALLOC=ON',
        '-DOGR_ENABLE_DRIVER_GPSBABEL=OFF', '-DGDAL_USE_HDF5=OFF', '-DGDAL_USE_HDFS=OFF',
        '-DGDAL_ENABLE_DRIVER_PDS=OFF',
        '-DGDAL_USE_OPENMP=OFF',
        ...ifDep(depPaths.sqlite3, (d) => [`-DSQLite3_INCLUDE_DIR=${d.header}`, `-DSQLite3_LIBRARY=${d.lib}`]),
        ...ifDep(depPaths.proj, (d) => [`-DPROJ_INCLUDE_DIR=${d.header}`, `-DPROJ_LIBRARY_RELEASE=${d.lib}`]),
        ...ifDep(depPaths.tiff, (d) => [`-DTIFF_INCLUDE_DIR=${d.header}`, `-DTIFF_LIBRARY_RELEASE=${d.lib}`]),
        ...ifDep(depPaths.jpeg, (d) => ['-DGDAL_USE_JPEG=ON', `-DJPEG_INCLUDE_DIR=${d.header}`, `-DJPEG_LIBRARY_RELEASE=${d.lib}`]),
        ...ifDep(depPaths.zstd, (d) => ['-DGDAL_USE_ZSTD=ON', `-DZSTD_INCLUDE_DIR=${d.header}`, `-DZSTD_LIBRARY=${d.lib}`]),
        ...ifDep(depPaths.Lerc, (d) => ['-DGDAL_USE_LERC=ON', `-DLERC_INCLUDE_DIR=${d.header}`, `-DLERC_LIBRARY=${d.lib}`]),
        ...ifDep(depPaths.geotiff, (d) => [`-DGEOTIFF_INCLUDE_DIR=${d.header}`, `-DGEOTIFF_LIBRARY_RELEASE=${d.lib}`]),
        ...ifDep(depPaths.z, (d) => [`-DZLIB_INCLUDE_DIR=${d.header}`, `-DZLIB_LIBRARY_RELEASE=${d.lib}`]),
        ...ifDep(depPaths.spatialite, (d) => [`-DSPATIALITE_INCLUDE_DIR=${d.header}`, `-DSPATIALITE_LIBRARY=${d.lib}`]),
        ...(depPaths.geos && depPaths.geos_c
            ? [`-DGEOS_INCLUDE_DIR=${depPaths.geos.header}`, `-DGEOS_LIBRARY=${depPaths.geos_c.lib}`]
            : []),
        ...ifDep(depPaths.webp, (d) => [`-DWEBP_INCLUDE_DIR=${d.header}`, `-DWEBP_LIBRARY=${d.lib}`]),
        ...ifDep(depPaths.expat, (d) => [`-DEXPAT_INCLUDE_DIR=${d.header}`, `-DEXPAT_LIBRARY=${d.lib}`]),
        ...ifDep(depPaths.iconv, (d) => [`-DIconv_INCLUDE_DIR=${d.header}`, `-DIconv_LIBRARY=${d.lib}`]),
        ...ifDep(depPaths.curl, (d) => ['-DGDAL_USE_CURL=ON', `-DCURL_INCLUDE_DIR=${d.header}`, `-DCURL_LIBRARY=${d.lib}`]),
    ],
    env: [
        'CFLAGS="-DRENAME_INTERNAL_LIBTIFF_SYMBOLS"',
        'CPPFLAGS="-DRENAME_INTERNAL_LIBTIFF_SYMBOLS"',
        'EMCC_CFLAGS="-DRENAME_INTERNAL_LIBTIFF_SYMBOLS"',
    ],
};
