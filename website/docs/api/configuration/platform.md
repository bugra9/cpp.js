# Platform
This object includes platform-specific configuration.

Here is a minimal example:
```js
import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    platform: {
        'Emscripten-x86_64': {
            ignoreLibName: ['charset'],
        },
        'Android-arm64-v8a': {
            data: {
                'share/proj': 'proj',
            },
            env: {
                PROJ_LIB: '_CPPJS_DATA_PATH_/proj',
            },
        },
    },
    paths: {
        project: getDirName(import.meta.url),
    },
};
```

### Attributes (Platforms)

| Platforms |
| ---- |
| Emscripten-x86_64 |
| Emscripten-x86_64-browser |
| Emscripten-x86_64-node |
| Android-arm64-v8a |
| iOS-iphoneos |
| iOS-iphonesimulator |

### Sub-Attributes

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | object | Copy local file to platform. **key:** local path, **value:** target path |
| env | object  | Set environment variables |
| ignoreLibName | array | Libraries not included in the linked project |

<br />

:::tip
Below are examples demonstrating various uses of the configurations.  
- [**ignoreLibName:** ['charset']](https://www.npmjs.com/package/cppjs-package-iconv?activeTab=code)
- [**data**, **env**](https://www.npmjs.com/package/cppjs-package-proj?activeTab=code)
:::
