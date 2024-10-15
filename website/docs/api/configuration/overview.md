# Overview
Cpp.js uses the **cppjs.config.js** file for configuration.
Based on the project structure, the configuration file extension can be **.js**, **.mjs**, or **.cjs**.
The configuration file is mandatory, and it must define the path to the project. This ensures that the project directory is located, regardless of which package manager or runtime is used.

A minimal configuration file would look like this:
```js
import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    paths: {
        project: getDirName(import.meta.url),
    },
};
```

The configuration object consists of six sections. These are:

| Attribute    | Description |
| -            | -           |
| general      | This object includes general configurations, such as the project name |
| dependencies | This array includes the dependencies of the project. |
| paths        | This object defines paths, such as the project path |
| ext          | This object specifies file extensions, including those for header files. |
| export       | This object includes configurations related to lib generation. |
| platform     | This object includes platform-specific configuration. |

<br />

:::tip
You can find the JavaScript file that generates the configuration [here.](https://github.com/bugra9/cpp.js/blob/main/core/cppjs-core/src/utils/getConfig.js)
:::
