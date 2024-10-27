# Export
This object includes configurations related to lib generation.

Here is a minimal example:
```js
import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    export: {
        type: 'cmake',
        libName: ['webp', 'sharpyuv'],
    },
    paths: {
        project: getDirName(import.meta.url),
    },
};
```

### Attributes

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| type | string | cmake |  options: source, cmake |
| libName | string | [config.general.name] | Names of output libraries. Typically used for generating multiple libraries |

<br />

:::tip
Below are examples demonstrating various uses of the configurations.  
- [**type:** source](https://www.npmjs.com/package/@cpp.js/sample-lib-source?activeTab=code)
- [**libName:** ['webp', 'sharpyuv']](https://www.npmjs.com/package/@cpp.js/package-webp?activeTab=code)
:::
