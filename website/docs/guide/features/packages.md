# Packages
Cpp.js offers flexibility with three types of packages, all available on NPM. You can use the existing packages or publish your own.

### Prebuilt Packages
This package includes prebuilt libraries for different platforms (Web, Android, iOS), enabling quick integration without needing to compile. By default, a package is of this type, meaning that most packages fall into this category.

#### Usage
Import the necessary header file directly from the package. Header files can be accessed from the `dist/prebuilt/PLATFORM_NAME/include` path.

Here is a minimal example:
```js title="JavaScript"
import { initCppJs } '@cpp.js/package-gdal/gdal.h';

const { Gdal } = await initCppJs();
```

#### Package Structure
```
└── dist
    ├── mylib.wasm
    ├── mylib.browser.js
    ├── mylib.node.js
    └── prebuilt
        ├── Android-arm64-v8a
        │   ├── include
        │   │   └── ...
        │   └── lib
        │       └── mylib.so
        │
        ├── Emscripten-x86_64
        │   ├── include
        │   │   └── ...
        │   └── lib
        │       └── mylib.a
        │
        ├── iOS-iphoneos
        │   ├── include
        │   │   └── ...
        │   └── lib
        │       └── mylib.a
        │
        ├── iOS-iphonesimulator
        │   ├── include
        │   │   └── ...
        │   └── lib
        │       └── mylib.a
        │
        ├── mylib.xcframework
        │   ├── ios-arm64_arm64e
        │   │   ├── Headers
        │   │   │   └── ...
        │   │   └── mylib.a
        │   │
        │   ├── ios-arm64_arm64e_x86_64-simulator
        │   │   ├── Headers
        │   │   │   └── ...
        │   │   └── mylib.a
        │   │
        │   └── Info.plist
        │
        ├── mylib.xcframework.zip
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
You can find the sample prebuilt package [here](https://www.npmjs.com/package/@cpp.js/sample-lib-prebuilt-matrix).
:::

### Source Code Packages
This package contains the raw C++ source code, which will be compiled during your project's build process. It’s suitable for users who want more control over the compilation or need platform-specific customizations.

#### Usage
Import the necessary header file directly from the package. Header files can be accessed from the `src/native` path.

Here is a minimal example:
```js title="JavaScript"
import { initCppJs } '@cppjs/sample-lib-source/samplebasic.h';

const { SampleBasic } = await initCppJs();
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
import { initCppJs } '@cpp.js/sample-lib-cmake/samplebasiccmake.h';

const { SampleBasicCmake } = await initCppJs();
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
