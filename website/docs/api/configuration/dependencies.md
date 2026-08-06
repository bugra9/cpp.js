# Dependencies
It is an array that contains the dependencies of the project. The array must be provided with the configuration object for the dependency.

Here is a minimal example:
```js
import tiff from '@cpp.js/package-tiff/cppjs.config.js';
import sqlite3 from '@cpp.js/package-sqlite3/cppjs.config.js';

export default {
    dependencies: [
        tiff,
        sqlite3,
    ]
    paths: {
        config: import.meta.url,
    },
};
```

### cargoDependencies

Rust crates the project consumes ride a sibling top-level map — the cargo
store axis next to the npm one. Keys are crate names, values are Cargo.toml
dependency specs as strings. Crates declared here become importable via the
`cargo:` scheme and usable from app-local `.rs` sources; importing an
undeclared crate is a hard error. See [Using Rust](/docs/guide/features/rust).

```js
export default {
    dependencies: [tiff, sqlite3],
    cargoDependencies: {
        uuid: '{ version = "1", features = ["v4"] }',
        semver: '1',
    },
    paths: {
        config: import.meta.url,
    },
};
```

:::tip
Below are examples demonstrating various uses of the configurations.  
- [dependencies: [tiff, sqlite3]](https://www.npmjs.com/package/@cpp.js/package-proj?activeTab=code)
:::
