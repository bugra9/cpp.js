export default {
    sha256: '3c20919cda9a505db07b5216baa980bacdaa0702da715b43f176fb07eff7e716', // geos-3.14.1.tar.bz2
    getURL: (version) => `https://download.osgeo.org/geos/geos-${version}.tar.bz2`,
    // wasi-sdk 34 libc++ include hygiene; a no-op elsewhere - re-check on GEOS bumps.
    replaceList: [
        {
            regex: '#include <cassert>',
            replacement: '#include <cassert>\n#include <type_traits>',
            paths: ['include/geos/geom/CoordinateSequence.h'],
        },
        {
            regex: '#include <cstdint>',
            replacement: '#include <cstdint>\n#include <algorithm>',
            paths: ['include/geos/algorithm/distance/DiscreteFrechetDistance.h'],
        },
        {
            regex: '#include <geos/geom/Geometry.h>',
            replacement: '#include <algorithm>\n#include <geos/geom/Geometry.h>',
            paths: ['include/geos/index/strtree/TemplateSTRtree.h'],
        },
        {
            regex: '#include <geos/export.h>',
            replacement: '#include <geos/export.h>\n#include <algorithm>',
            paths: ['include/geos/shape/fractal/HilbertEncoder.h'],
        },
    ],
    buildType: 'cmake',
    getBuildParams: (target) => [
        '-DBUILD_TESTING=OFF',
        '-DBUILD_GEOSOP=OFF',
    ],
};
