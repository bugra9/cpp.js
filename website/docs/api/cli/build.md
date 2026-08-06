# Build
```bash
Usage: cppjs build [options]

compile the project that was set up using Cpp.js

Options:
  -p, --platform <platform>      target platform (choices: "wasm", "wasi", "android", "ios")
  -a, --arch <arch>              target architecture (choices: "wasm32", "wasm64", "arm64-v8a", "x86_64", "iphoneos", "iphonesimulator")
  -r, --runtime <runtime>        target runtime (choices: "st", "mt")
  -b, --build-type <buildType>   target build type (choices: "release", "debug")
  -e, --runtime-env <runtimeEnv> target runtime environment (choices: "browser", "edge", "node")
  -h, --help                     display help for command
```

Each option accepts a comma-separated list. When an option is omitted, all valid values are selected (except `wasm64`, which is opt-in).

<br />

**Output**

The build outputs platform-specific artifacts under `dist/prebuilt/<platform>-<arch>-<runtime>-<buildType>/`. For each WebAssembly target, the corresponding `.js` and `.wasm` files are also emitted with the runtime environment (browser, edge, node) embedded in the file name.

```
├── dist
│   ├── mylib-wasm-wasm32-st-release.browser.js
│   ├── mylib-wasm-wasm32-st-release.browser.wasm
│   ├── mylib-wasm-wasm32-st-release.edge.js
│   ├── mylib-wasm-wasm32-st-release.edge.wasm
│   ├── mylib-wasm-wasm32-st-release.node.js
│   ├── mylib-wasm-wasm32-st-release.node.wasm
│   ├── mylib-wasm-wasm32-mt-release.browser.js
│   ├── mylib-wasm-wasm32-mt-release.browser.wasm
│   ├── mylib-wasm-wasm32-mt-release.node.js
│   ├── mylib-wasm-wasm32-mt-release.node.wasm
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
    ├── ios-arm64
    │   ├── Headers
    │   │   └── ...
    │   └── libmylib.a
    │
    ├── ios-arm64-simulator
    │   ├── Headers
    │   │   └── ...
    │   └── libmylib.a
    │
    └── Info.plist
```

Here is a minimal example that builds only the WebAssembly targets:

```json title="package.json"
{
    "name": "cf-worker-example",
    "scripts": {
       "build": "cppjs build -p wasm"
    }
}
```

A more targeted invocation that limits the architecture, runtime, build type, and runtime environment:

```sh
cppjs build -p wasm -a wasm32 -r st -b release -e browser,node
```

:::info 
**Create library function:** You can access the create library function from [this link](https://github.com/bugra9/cpp.js/blob/main/cppjs-core/cpp.js/src/actions/createLib.js).  
**Build WebAssembly function:** You can access the build WebAssembly function from [this link](https://github.com/bugra9/cpp.js/blob/main/cppjs-core/cpp.js/src/actions/buildWasm.js).  
**Create XCFramework function:** You can access the create XCFramework function from [this link](https://github.com/bugra9/cpp.js/blob/main/cppjs-core/cpp.js/src/actions/createXCFramework.js).  
:::
