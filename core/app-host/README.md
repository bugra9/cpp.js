# @crossbind/core-app-host
**crossbind app host**  
Runs the crossbind embind runtime in Hermes inside a desktop app whose page is the system webview, so the bindings
that serve WebAssembly on the web run natively in an app, behind the same page code.

<a href="https://www.npmjs.com/package/@crossbind/core-app-host">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/core-app-host/beta?style=for-the-badge" />
</a>
<a href="https://github.com/crossbind/crossbind/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/crossbind/crossbind?style=for-the-badge" />
</a>

## Use

Add it next to `crossbind` and the Vite plugin, and mark the project as an app in `crossbind.config.js`
(`target: { runtimeEnv: 'app' }`):

```bash
pnpm add -D crossbind@beta @crossbind/plugin-vite@beta @crossbind/core-app-host@beta
pnpm vite          # the app on the dev server
pnpm vite build    # dist/<name>.app
```

crossbind resolves this package from your project; you never import it yourself. See the
[app reference](https://github.com/crossbind/crossbind/blob/main/docs/api/app.md) for the page's contract, security
defaults and current limits (macOS for now).

## Contents

- `cpp/` — the host's CMake project: Hermes on a thread of its own, the page's messages and `crossbind://` requests
  (`src/host_core.cpp`), and the macOS window, channels and navigation rule (`src/darwin/`).
- `js/host.js` — what runs in Hermes: the embind runtime and the side of the protocol that answers the page.
- `js/page.js` — what the page loads as `crossbind.js`: `initNative()` over the webview's messages.
- `third_party/webview/` — webview/webview (MIT), vendored at a pinned commit; provenance and the local patch are in
  its README.
- `third_party/jsi/` — JSI's `jsi.cpp` (MIT) from the Hermes release the host links.

Hermes itself is React Native's published build (MIT), downloaded once into `~/.crossbind/hermes/` and checked against
the sha256 crossbind pins.

## License

MIT
