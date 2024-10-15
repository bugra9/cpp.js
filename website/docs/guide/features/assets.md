# Assets
Native applications may require assets to function properly. Cpp.js automates the process of copying and utilizing these assets in the necessary locations. To achieve this, you only need to define the assets in the cppjs.config.js file.

Here is a minimal config example:
```js title="cppjs.config.js"
import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    paths: {
        project: getDirName(import.meta.url),
    },
    platform: {
        'Emscripten-x86_64-browser': {
            k: {
                'share/proj': '/usr/share/proj',
            },
            env: {
                PROJ_LIB: '/usr/share/proj',
            },
        },
        'Emscripten-x86_64-node': {
            data: {
                'share/proj': 'proj',
            },
            env: {
                PROJ_LIB: '_CPPJS_DATA_PATH_/proj',
            },
        },
        'Android-arm64-v8a': {
            data: {
                'share/proj': 'proj',
            },
            env: {
                PROJ_LIB: '_CPPJS_DATA_PATH_/proj',
            },
        },
        'iOS-iphoneos': {
            data: {
                'share/proj': 'proj',
            },
            env: {
                PROJ_LIB: '_CPPJS_DATA_PATH_/proj',
            },
        },
    },
};
```

In the provided example, the project creates the assets it will use during compilation in the `share/proj` directory.

Under the "data" property, the key specifies the path of the assets in the library, and the value specifies where to save them on the target platform. If the target platform path does not start with a `/`, the assets are saved in the directory defined by `_CPPJS_DATA_PATH_`. This variable is utilized when setting the environment.

System environments are also configured under the "env" property. Here, you can define where the native application will locate the assets.

:::info
The configuration documentation can be accessed [here](/docs/api/configuration/platform).
:::
