const platformCmake = {
    'Emscripten-x86_64': ['-DBUILD_SHARED_LIBS=OFF'],
    'Android-arm64-v8a': ['-DCMAKE_ANDROID_STL_TYPE=c++_shared'],
    'Android-x86_64': ['-DCMAKE_ANDROID_STL_TYPE=c++_shared'],
};

export default {
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
            replacement: '# include <iconv.h>\nextern "C" {\n    extern __attribute__((__visibility__("default"))) iconv_t libiconv_open (const char* tocode, const char* fromcode);\n    extern __attribute__((__visibility__("default"))) size_t libiconv (iconv_t cd,  char* * inbuf, size_t *inbytesleft, char* * outbuf, size_t *outbytesleft);\n}',
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
    getBuildParams: (platform, depPaths, ext) => [
        ...(platformCmake[platform] || []),
        '-DBUILD_APPS=OFF', '-DBUILD_TESTING=OFF', '-DACCEPT_MISSING_SQLITE3_MUTEX_ALLOC=ON',
        '-DOGR_ENABLE_DRIVER_GPSBABEL=OFF', '-DGDAL_USE_HDF5=OFF', '-DGDAL_USE_HDFS=OFF',
        '-DGDAL_USE_ZSTD=OFF', '-DGDAL_ENABLE_DRIVER_PDS=OFF',
        `-DSQLite3_INCLUDE_DIR=${depPaths.sqlite3.header}`, `-DSQLite3_LIBRARY=${depPaths.sqlite3.lib}`,
        `-DPROJ_INCLUDE_DIR=${depPaths.proj.header}`, `-DPROJ_LIBRARY_RELEASE=${depPaths.proj.lib}`,
        `-DTIFF_INCLUDE_DIR=${depPaths.tiff.header}`, `-DTIFF_LIBRARY_RELEASE=${depPaths.tiff.lib}`,
        `-DGEOTIFF_INCLUDE_DIR=${depPaths.geotiff.header}`, `-DGEOTIFF_LIBRARY_RELEASE=${depPaths.geotiff.lib}`,
        `-DZLIB_INCLUDE_DIR=${depPaths.z.header}`, `-DZLIB_LIBRARY_RELEASE=${depPaths.z.lib}`,
        `-DSPATIALITE_INCLUDE_DIR=${depPaths.spatialite.header}`, `-DSPATIALITE_LIBRARY=${depPaths.spatialite.lib}`,
        `-DGEOS_INCLUDE_DIR=${depPaths.geos.header}`, `-DGEOS_LIBRARY=${depPaths.geos_c.lib}`,
        `-DWEBP_INCLUDE_DIR=${depPaths.webp.header}`, `-DWEBP_LIBRARY=${depPaths.webp.lib}`,
        `-DEXPAT_INCLUDE_DIR=${depPaths.expat.header}`, `-DEXPAT_LIBRARY=${depPaths.expat.lib}`,
        `-DIconv_INCLUDE_DIR=${depPaths.iconv.header}`, `-DIconv_LIBRARY=${depPaths.iconv.lib}`,
    ],
    env: [
        'CFLAGS="-DRENAME_INTERNAL_LIBTIFF_SYMBOLS"',
        'CPPFLAGS="-DRENAME_INTERNAL_LIBTIFF_SYMBOLS"',
        'EMCC_CFLAGS="-DRENAME_INTERNAL_LIBTIFF_SYMBOLS"',
    ],
};
