# Packages
Cpp.js offers flexibility with three types of packages, all available on NPM. You can use the existing packages or publish your own.

### Prebuilt Packages
This package includes prebuilt libraries for different platforms (Web, Android, iOS), enabling quick integration without needing to compile. By default, a package is of this type, meaning that most packages fall into this category.

Starting with v2, prebuilt packages are split into a small meta package plus three platform-specific packages so that consumers only download artifacts for the platforms they actually target. For example, `@cpp.js/package-gdal` is a thin meta package that depends on `@cpp.js/package-gdal-wasm`, `@cpp.js/package-gdal-android`, and `@cpp.js/package-gdal-ios`. Importing the meta package automatically pulls in the right platform variant for the target you build.

#### Usage
Import the necessary header file directly from the package. Header files can be accessed from the `dist/prebuilt/PLATFORM_NAME/include` path.

Here is a minimal example:
```js title="JavaScript"
import { initCppJs, Gdal } from '@cpp.js/package-gdal/gdal.h';

await initCppJs();
```

#### Build
Cpp.js can compile external projects using CMake and configure. To set up the build process for an external project, you can create a cppjs.build.js file in the platform-specific package directory to configure the build process. Once configured, use the cppjs build command to compile the project.

Here are some examples of how cppjs.build.js files are structured for different projects:

- [@cpp.js/package-zlib-wasm/cppjs.build.js](https://github.com/bugra9/cpp.js/blob/main/cppjs-packages/cppjs-package-zlib/cppjs-package-zlib-wasm/cppjs.build.js)
- [@cpp.js/package-webp-wasm/cppjs.build.js](https://github.com/bugra9/cpp.js/blob/main/cppjs-packages/cppjs-package-webp/cppjs-package-webp-wasm/cppjs.build.js)
- [@cpp.js/package-gdal-wasm/cppjs.build.js](https://github.com/bugra9/cpp.js/blob/main/cppjs-packages/cppjs-package-gdal/cppjs-package-gdal-wasm/cppjs.build.js)
- [@cpp.js/package-spatialite-wasm/cppjs.build.js](https://github.com/bugra9/cpp.js/blob/main/cppjs-packages/cppjs-package-spatialite/cppjs-package-spatialite-wasm/cppjs.build.js)

#### Package Structure
```
├── dist
│   ├── mylib-wasm-wasm32-st-release.browser.js
│   ├── mylib-wasm-wasm32-st-release.browser.wasm
│   ├── mylib-wasm-wasm32-st-release.node.js
│   ├── mylib-wasm-wasm32-st-release.node.wasm
│   └── prebuilt
│       ├── wasm-wasm32-st-release
│       │   ├── include
│       │   │   └── ...
│       │   └── lib
│       │       └── libmylib.a
│       │
│       ├── wasm-wasm32-mt-release
│       │   ├── include
│       │   │   └── ...
│       │   └── lib
│       │       └── libmylib.a
│       │
│       ├── android-arm64-v8a-mt-release
│       │   ├── include
│       │   │   └── ...
│       │   └── lib
│       │       └── libmylib.a
│       │
│       ├── android-x86_64-mt-release
│       │   ├── include
│       │   │   └── ...
│       │   └── lib
│       │       └── libmylib.a
│       │
│       ├── ios-iphoneos-mt-release
│       │   ├── include
│       │   │   └── ...
│       │   └── lib
│       │       └── libmylib.a
│       │
│       ├── ios-iphonesimulator-mt-release
│       │   ├── include
│       │   │   └── ...
│       │   └── lib
│       │       └── libmylib.a
│       │
│       └── CMakeLists.txt
|
└── mylib.xcframework
    ├── ios-arm64_arm64e
    │   ├── Headers
    │   │   └── ...
    │   └── libmylib.a
    │
    ├── ios-arm64_x86_64-simulator
    │   ├── Headers
    │   │   └── ...
    │   └── libmylib.a
    │
    └── Info.plist
 
```

#### Configuration
```diff title="cppjs.config.js"
export default {
    export: {
+       type: 'cmake',
    },
    paths: {
        config: import.meta.url,
    },
};
```

:::info
You can find the sample prebuilt package [here](https://www.npmjs.com/package/@cpp.js/sample-lib-prebuilt-matrix).
:::

### Source Code Packages
This package contains the raw C++ source code, which will be compiled during your project's build process. It’s suitable for users who want more control over the compilation or need platform-specific customizations.

#### Usage
Import the necessary header file directly from the package. Header files can be accessed from the `src/native` path.

Here is a minimal example:
```js title="JavaScript"
import { initCppJs, SampleBasic } from '@cppjs/sample-lib-source/samplebasic.h';

await initCppJs();
```

#### Package Structure
```
└── src
    └── native
        ├── samplebasic.h
        └── samplebasic.cpp
```

#### Configuration
```diff title="cppjs.config.js"
export default {
    export: {
+       type: 'source',
    },
    paths: {
        config: import.meta.url,
    },
};
```

:::info
You can find the sample source code package [here](https://www.npmjs.com/package/@cppjs/sample-lib-source).
:::

### Cmake Packages
In addition to the source code, this package includes a CMakeLists.txt file, which provides users with more flexibility when integrating with custom CMake build systems. This package is ideal for projects that rely on CMake to manage builds and dependencies.

#### Usage
Import the necessary header file directly from the package. Header files can be accessed from the `src/native` path.

Here is a minimal example:
```js title="JavaScript"
import { initCppJs, SampleBasicCmake } from '@cpp.js/sample-lib-cmake/samplebasiccmake.h';

await initCppJs();
```

#### Package Structure
```
├── src
│   └── native
│       ├── samplebasiccmake.h
│       └── samplebasiccmake.cpp
│
└── CMakeLists.txt
```

#### Configuration
```diff title="cppjs.config.js"
export default {
    export: {
+       type: 'cmake',
    },
    paths: {
        config: import.meta.url,
    },
};
```

:::info
You can find the cmake package [here](https://www.npmjs.com/package/@cpp.js/sample-lib-cmake).
:::
