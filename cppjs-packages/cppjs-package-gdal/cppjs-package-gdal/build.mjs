const platformCmake = {
    'wasm': ['-DBUILD_SHARED_LIBS=OFF'],
    'wasi': [
        // try_compile probes cannot carry the trailing -lunwind the wasm-EH
        // runtime needs; seed the stdc++ link check instead.
        '-D_TEST_LINK_STDCPP:INTERNAL=1',
        // Jail finds to the passed prefixes - host package configs
        // (Homebrew Arrow, ...) leak into the cross build otherwise.
        '-DCMAKE_FIND_ROOT_PATH_MODE_PACKAGE=ONLY',
        '-DCMAKE_FIND_ROOT_PATH_MODE_LIBRARY=ONLY',
        '-DCMAKE_FIND_ROOT_PATH_MODE_INCLUDE=ONLY',
        // The codec packages have no wasi prebuilts yet; bundle GDAL's
        // internal copies instead.
        '-DGDAL_USE_PNG_INTERNAL=ON', '-DGDAL_USE_JPEG_INTERNAL=ON',
        '-DGDAL_USE_JPEG12_INTERNAL=ON', '-DGDAL_USE_GIF_INTERNAL=ON',
        // GPKG is an ogr_dependent_driver on SQLITE: without the explicit
        // pair it stays silently disabled.
        '-DOGR_ENABLE_DRIVER_SQLITE=ON', '-DOGR_ENABLE_DRIVER_GPKG=ON',
        '-DGDAL_USE_ICONV=OFF',
    ],
    'android': ['-DCMAKE_ANDROID_STL_TYPE=c++_shared', '-DCMAKE_DISABLE_FIND_PACKAGE_Python=ON', '-DBUILD_PYTHON_BINDINGS=OFF'],
};

// wasi prebuilts exist for these packages only; the other deps' cmake hints
// would point at directories that do not exist for wasi targets.
const WASI_READY_DEPS = new Set(['sqlite3', 'proj', 'tiff', 'geotiff', 'z']);

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
        // WASI carries no processes (fork/exec/wait) and no mkstemp; the
        // patches below are all __wasi__-guarded, so every other platform
        // compiles the untouched upstream body.
        {
            regex: '#include "cpl_port.h"\n#include "cpl_spawn.h"',
            replacement: '#include "cpl_port.h"\n#include "cpl_spawn.h"\n\n/* WASI: no processes on wasm32-wasip1 - every spawn entry point fails\n   cleanly instead of referencing fork/exec/wait. */\n#ifdef __wasi__\n#include "cpl_error.h"\n\nint CPLSpawn(const char *const *, VSILFILE *, VSILFILE *, int bDisplayErr)\n{\n    if (bDisplayErr)\n        CPLError(CE_Failure, CPLE_NotSupported, "CPLSpawn not supported on WASI");\n    return -1;\n}\n\nCPLSpawnedProcess *CPLSpawnAsync(int (*)(CPL_FILE_HANDLE, CPL_FILE_HANDLE),\n                                 const char *const *, int, int, int, char **)\n{\n    CPLError(CE_Failure, CPLE_NotSupported, "CPLSpawnAsync not supported on WASI");\n    return nullptr;\n}\n\nCPL_PID CPLSpawnAsyncGetChildProcessId(CPLSpawnedProcess *) { return -1; }\nint CPLSpawnAsyncFinish(CPLSpawnedProcess *, int, int) { return -1; }\nCPL_FILE_HANDLE CPLSpawnAsyncGetInputFileHandle(CPLSpawnedProcess *) { return -1; }\nCPL_FILE_HANDLE CPLSpawnAsyncGetOutputFileHandle(CPLSpawnedProcess *) { return -1; }\nCPL_FILE_HANDLE CPLSpawnAsyncGetErrorFileHandle(CPLSpawnedProcess *) { return -1; }\nvoid CPLSpawnAsyncCloseInputFileHandle(CPLSpawnedProcess *) {}\nvoid CPLSpawnAsyncCloseOutputFileHandle(CPLSpawnedProcess *) {}\nvoid CPLSpawnAsyncCloseErrorFileHandle(CPLSpawnedProcess *) {}\nint CPLPipeRead(CPL_FILE_HANDLE, void *, int) { return FALSE; }\nint CPLPipeWrite(CPL_FILE_HANDLE, const void *, int) { return FALSE; }\n\n#else /* !__wasi__ */',
            paths: ['port/cpl_spawn.cpp'],
        },
        {
            regex: '    return p->ferr;\n}',
            replacement: '    return p->ferr;\n}\n\n#endif /* !__wasi__ */',
            paths: ['port/cpl_spawn.cpp'],
        },
        {
            regex: '    int fd = mkstemp\\(osTmpFilename\\.data\\(\\)\\);',
            replacement: '#ifdef __wasi__\n    // wasi-libc has no mkstemp; take the plain-path fallback below\n    int fd = -1;\n#else\n    int fd = mkstemp(osTmpFilename.data());\n#endif',
            paths: ['port/cpl_vsil_unix_stdio_64.cpp'],
        },
        {
            regex: '#include "gdalalg_external.h"\n#include "gdalalg_materialize.h"',
            replacement: '#include "gdalalg_external.h"\n\n/* WASI: the external subcommand launches child processes, which do not\n   exist on wasm32-wasip1 - fail cleanly instead. */\n#ifdef __wasi__\n#include "cpl_error.h"\n\nGDALExternalAlgorithmBase::~GDALExternalAlgorithmBase() = default;\n\nbool GDALExternalAlgorithmBase::Run(const std::vector<std::string> &,\n                                    std::vector<GDALArgDatasetValue> &,\n                                    const std::string &, GDALArgDatasetValue &)\n{\n    CPLError(CE_Failure, CPLE_NotSupported,\n             "External pipeline steps are not supported on WASI");\n    return false;\n}\n\nGDALExternalRasterOrVectorAlgorithm::~GDALExternalRasterOrVectorAlgorithm() =\n    default;\nGDALExternalRasterAlgorithm::~GDALExternalRasterAlgorithm() = default;\nGDALExternalVectorAlgorithm::~GDALExternalVectorAlgorithm() = default;\n\n#else /* !__wasi__ */\n#include "gdalalg_materialize.h"',
            paths: ['apps/gdalalg_external.cpp'],
        },
        {
            regex: '//! @endcond',
            replacement: '//! @endcond\n\n#endif /* !__wasi__ */',
            paths: ['apps/gdalalg_external.cpp'],
        },
    ],
    buildType: 'cmake',
    getBuildParams: (target, allDepPaths) => {
        const depPaths = target.platform === 'wasi'
            ? Object.fromEntries(Object.entries(allDepPaths).filter(([name]) => WASI_READY_DEPS.has(name)))
            : allDepPaths;
        return [
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
        ];
    },
    env: [
        'CFLAGS="-DRENAME_INTERNAL_LIBTIFF_SYMBOLS"',
        'CPPFLAGS="-DRENAME_INTERNAL_LIBTIFF_SYMBOLS"',
        'EMCC_CFLAGS="-DRENAME_INTERNAL_LIBTIFF_SYMBOLS"',
    ],
};
