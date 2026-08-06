# Export
This object includes configurations related to lib generation.

Here is a minimal example:
```js
export default {
    export: {
        type: 'cmake',
        libName: ['webp', 'sharpyuv'],
    },
    paths: {
        config: import.meta.url,
    },
};
```

### Attributes

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| type | string | cmake |  options: source, cmake, cargo. `cargo` builds a Rust crate per platform and stages the static library like any prebuilt — see [Using Rust](/docs/guide/features/rust) |
| crate | string | . | `type: 'cargo'` only: directory holding `Cargo.toml`, relative to the project |
| libName | string | [config.general.name] | Names of output libraries. Typically used for generating multiple libraries |
| bindings.vectors | array | — | Standalone `Vec<T>` classes to expose, e.g. `[{ of: 'i32', name: 'RustIntVector' }]` |

Rust crates your project consumes are NOT declared here — they live in the
top-level [`cargoDependencies`](/docs/api/configuration/dependencies) map,
next to `dependencies`.

<br />

:::tip
Below are examples demonstrating various uses of the configurations.  
- [**type:** source](https://www.npmjs.com/package/@cpp.js/sample-lib-source?activeTab=code)
- [**libName:** ['webp', 'sharpyuv']](https://www.npmjs.com/package/@cpp.js/package-webp?activeTab=code)
:::
