# Build
```bash
Usage: cppjs build [options]

compile the project that was set up using Cpp.js

Options:
  -p, --platform <platform>  target platform (choices: "all", "wasm", "android", "ios", default: "all")
  -h, --help                 display help for command
```

<br />

**Output**
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

Here is a minimal example:

```json title="package.json"
{
    "name": "cf-worker-example",
    "scripts": {
       "build": "cppjs build -p wasm"
    }
}
```

:::info 
**Create library function:** You can access the create library function from [this link](https://github.com/bugra9/cpp.js/blob/main/core/cppjs-core/src/functions/createLib.js).  
**Create webassembly function:** You can access the create webassembly function from [this link](https://github.com/bugra9/cpp.js/blob/main/core/cppjs-core/src/functions/createWasm.js).  
:::
