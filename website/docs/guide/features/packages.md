# Packages
Cpp.js offers flexibility with three types of packages, all available on NPM. You can use the existing packages or publish your own.

### Prebuilt Packages
This package includes prebuilt libraries for different platforms (Web, Android, iOS), enabling quick integration without needing to compile. By default, a package is of this type, meaning that most packages fall into this category.

#### Usage
Import the necessary header file directly from the package. Header files can be accessed from the `dist/prebuilt/PLATFORM_NAME/include` path.

Here is a minimal example:
```js title="JavaScript"
import { initCppJs, Gdal } from '@cpp.js/package-gdal/gdal.h';

await initCppJs();
```

#### Build
Cpp.js can compile external projects using CMake and configure. To set up the build process for an external project, you can create a cppjs.build.js file in your project’s home directory to configure the build process. Once configured, use the cppjs build command to compile the project.

Here are some examples of how cppjs.build.js files are structured for different projects:

- [@cpp.js/package-zlib/cppjs.build.js](https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-package-zlib/cppjs.build.js)
- [@cpp.js/package-webp/cppjs.build.js](https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-package-webp/cppjs.build.js)
- [@cpp.js/package-gdal/cppjs.build.js](https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-package-gdal/cppjs.build.js)
- [@cpp.js/package-spatialite/cppjs.build.js](https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-package-spatialite/cppjs.build.js)

#### Package Structure
```
├── dist
│   ├── mylib.wasm
│   ├── mylib.browser.js
│   ├── mylib.node.js
│   └── prebuilt
│       ├── Android-arm64-v8a
│       │   ├── include
│       │   │   └── ...
│       │   └── lib
│       │       └── mylib.so
│       │
│       ├── Android-x86_64
│       │   ├── include
│       │   │   └── ...
│       │   └── lib
│       │       └── mylib.so
│       │
│       ├── Emscripten-x86_64
│       │   ├── include
│       │   │   └── ...
│       │   └── lib
│       │       └── mylib.a
│       │
│       ├── iOS-iphoneos
│       │   ├── include
│       │   │   └── ...
│       │   └── lib
│       │       └── mylib.a
│       │
│       ├── iOS-iphonesimulator
│       │   ├── include
│       │   │   └── ...
│       │   └── lib
│       │       └── mylib.a
│       │
│       ├── mylib.xcframework.zip
│       └── CMakeLists.txt
|
└── mylib.xcframework
    ├── ios-arm64_arm64e
    │   ├── Headers
    │   │   └── ...
    │   └── mylib.a
    │
    ├── ios-arm64_arm64e_x86_64-simulator
    │   ├── Headers
    │   │   └── ...
    │   └── mylib.a
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
