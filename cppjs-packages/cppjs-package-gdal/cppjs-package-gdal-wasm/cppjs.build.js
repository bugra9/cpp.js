import build from '@cpp.js/package-gdal/build.mjs';

export default {
    ...build,
    replaceList: [
        ...build.replaceList,
        {
            regex: 'CPL_CPUID\\(1, cpuinfo\\);',
            replacement: '#ifdef __wasm__\n    cpuinfo[0]=0;cpuinfo[1]=0;cpuinfo[2]=0;cpuinfo[3]=0;\n#else\n    CPL_CPUID(1, cpuinfo);\n#endif',
            paths: ['port/cpl_cpu_features.cpp'],
        },
        {
            regex: '__asm__\\("xgetbv" : "=a"\\(nXCRLow\\), "=d"\\(nXCRHigh\\) : "c"\\(0\\)\\);',
            replacement: '#ifdef __wasm__\n    nXCRLow = 0; nXCRHigh = 0;\n#else\n    $&\n#endif',
            paths: ['port/cpl_cpu_features.cpp'],
        },
        {
            regex: 'bCPLHasAVX2 = CPLHaveRuntimeAVX\\(\\) && __builtin_cpu_supports\\("avx2"\\);',
            replacement: '#ifdef __wasm__\n    bCPLHasAVX2 = false;\n#else\n    $&\n#endif',
            paths: ['port/cpl_cpu_features.cpp'],
        },
    ],
};
