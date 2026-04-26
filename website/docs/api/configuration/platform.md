# Target Specs
This array includes target-specific configuration. Each entry filters by any combination of `platform`, `arch`, `runtime`, `buildType`, and `runtimeEnv`, and applies its `specs` block to every build target that matches the filter. Omit a field to match all of its values.

Here is a minimal example:
```js
export default {
    targetSpecs: [
        {
            platform: 'wasm',
            specs: {
                ignoreLibName: ['charset'],
            },
        },
        {
            platform: 'android',
            specs: {
                data: {
                    'share/proj': 'proj',
                },
                env: {
                    PROJ_LIB: '_CPPJS_DATA_PATH_/proj',
                },
            },
        },
    ],
    paths: {
        config: import.meta.url,
    },
};
```

### Filter Fields

| Field       | Allowed values |
| ----------- | -------------- |
| platform    | `wasm`, `android`, `ios` |
| arch        | `wasm32`, `wasm64`, `arm64-v8a`, `x86_64`, `iphoneos`, `iphonesimulator` |
| runtime     | `st`, `mt` |
| buildType   | `release`, `debug` |
| runtimeEnv  | `browser`, `edge`, `node` (only meaningful when `platform === 'wasm'`) |

### Spec Sub-Attributes

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | object | Copy local file to platform. **key:** local path, **value:** target path |
| env | object  | Set environment variables |
| ignoreLibName | array | Libraries not included in the linked project |

<br />

:::tip
Below are examples demonstrating various uses of the configurations.  
- [**ignoreLibName:** ['charset']](https://www.npmjs.com/package/@cpp.js/package-iconv-wasm?activeTab=code)
- [**data**, **env**](https://www.npmjs.com/package/@cpp.js/package-proj-wasm?activeTab=code)
:::
