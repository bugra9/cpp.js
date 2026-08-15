# @cpp.js/typescript-config

Shared TypeScript configuration for cpp.js projects. It wires the editor
types cpp.js generates under `.cppjs/` — for C++ `.h` imports, app-local
Rust `.rs` imports and `cargo:` crate imports — extend it once and never
manage the wiring by hand:

```jsonc
// tsconfig.json (TS 5.5+)
{ "extends": "@cpp.js/typescript-config" }
```

```jsonc
// already extending another config? use the array form (TS 5.0+)
{ "extends": ["@react-native/typescript-config", "@cpp.js/typescript-config"] }
```

Install it as a direct devDependency (package-name `extends` resolves through
Node resolution, so a transitive copy is not enough under strict pnpm):

```sh
npm install -D @cpp.js/typescript-config
```

## What it wires

- `rootDirs` overlays your project root with `.cppjs/types/`, where cpp.js
  mirrors the declaration of every relative native import — C++ headers
  (`import { Native } from './native/native.h'`) and app-local Rust files
  (`import { Hull } from './native/geo_surface.rs'`) alike. Relative imports
  are typed by path resolution, so this overlay is what keeps generated
  `.d.ts` files out of your source folders. Each of those declarations also
  types `initNative()`, the boot call every generated module exports.
- `include` pulls in `.cppjs/rust-crates/types/`, the ambient
  `declare module 'cargo:<name>'` declarations for direct crate imports.

## Caveats

- `include` is overridden (not merged) when your tsconfig defines its own —
  keep `.cppjs/rust-crates/types/**/*.d.ts` in your list in that case.
- Paths assume the default cache directory (`.cppjs`). If you override
  `paths.cache` in `cppjs.config.js`, copy the two settings into your own
  tsconfig with the custom path instead.

## License

MIT
