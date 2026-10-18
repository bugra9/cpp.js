# Apps — `target.runtimeEnv: 'app'`

> A desktop app whose page runs in the system webview and whose bindings run natively in the app's own process, with
> no Node.js and no browser engine of its own. macOS for now; Linux, iOS and Android follow.

The page calls the module exactly as a web build that runs its module in a worker does: `initNative()` resolves to the
module, and every call is awaited. The C++ and Rust behind it run in Hermes, inside the app, with the speed and the
system access of native code.

## Set up

```bash
pnpm add -D crossbind@beta @crossbind/plugin-vite@beta @crossbind/core-app-host@beta vite
```

```js
// crossbind.config.js
export default {
    general: { name: 'my-app' },
    target: { runtimeEnv: 'app' },
    paths: { config: import.meta.url },
};
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import viteCrossbindPlugin from '@crossbind/plugin-vite';

export default defineConfig({ plugins: [viteCrossbindPlugin()] });
```

`npm create crossbind@beta -- <dir> Desktop App` scaffolds such a project from `examples/desktop-app`.

## Develop and build

| Command | What it does |
|---|---|
| `vite` | Builds the host for this Mac and opens the app on the dev server. An edit to the page reloads it; an edit to native code, or to what the page imports from it, rebuilds the host and opens the app again. The page's console shows in the terminal, and closing the window ends the session. |
| `vite build` | Builds the page and the host and writes `dist/<name>.app`, signed ad hoc. |
| `crossbind build -p host -e app` | Builds the host alone into `<paths.output>/<name>.darwin-<arch>.app`, with no page in it. |

The first build downloads Hermes once (see [Hermes](#hermes)).

## The page

`initNative()` and the imports from headers and crates work as in a web build with `useWorker`
([`threading.md`](./threading.md)):

- Every call, `new` and property read returns a promise.
- An object stays in the app's process; the page holds a handle, which the garbage collector releases. A page that
  replaces the page, a reload among them, frees what the previous one held.
- Vectors arrive as arrays, and a plain array passed for a vector parameter becomes one.
- Enum values keep their identity.
- An error keeps its own fields, such as `code`.
- A JavaScript function cannot be passed to the module (`DataCloneError`).

`initNative({ env })` sets environment variables in the app's process. The build's env is the app's own, and a variable
the process already has keeps its value.

## What the app holds

```
<name>.app/Contents/
├── Info.plist                    CFBundleIdentifier dev.crossbind.<name>
├── MacOS/<name>                  the window, the webview, Hermes and the bindings
├── Frameworks/hermesvm.framework
└── Resources/
    ├── host.hbc                  the embind runtime and the protocol, as Hermes bytecode
    ├── page/                     what Vite built, served at crossbind://app/
    └── data/                     the packages' data (CROSSBIND_DATA_PATH)
```

The sample app is 6.7 MB on disk and 1.8 MB zipped (arm64): a 0.8 MB host and a 6 MB Hermes. It shows its first
native result 0.34 s after launch on an M-series Mac.

## Security

- The webview loads `crossbind://app` alone, in any frame; during development, the dev server too. A frame from
  another origin would reach the module's channel and its `crossbind://` requests, so none is loaded. A link the user
  follows to another page opens in the default browser, and any other navigation away is refused.
- The module's channel answers frames of those origins only. Calls that travel as `crossbind://` requests carry a
  token the page learns through that channel, so markup, such as an image, and frames the channel refuses cannot make
  one.
- Responses from `crossbind://` let another origin read them only during development, when the page comes from the
  dev server.
- Only the debug host the dev server opens reads `CROSSBIND_APP_URL`; a release build always loads its own page.

## Hermes

The host runs React Native's Hermes for Apple platforms, release `250829098.0.17`. The first build downloads it from
Maven Central into `~/.crossbind/hermes/` and checks it against the sha256 crossbind pins.

`crossbind licenses -e app` lists what the app carries beside its packages: crossbind's runtime, Hermes, JSI's
`jsi.cpp` from the same release and webview/webview, each with its version, its sha256 and its license text.
`--notices` writes them to a file to ship with the app.

## Environment variables of the app

| Variable | Effect |
|---|---|
| `CROSSBIND_APP_URL` | Opens this page instead of `crossbind://app/`, in a debug build only; the Vite plugin sets it to the dev server. |
| `CROSSBIND_APP_CONSOLE` | Writes the page's console and uncaught errors to the app's output; on during development. |

## Limits

- macOS 11 or later, built on macOS.
- The ad hoc signature opens the app on the Mac that built it. Developer ID signing and notarization are not wired yet.
- One window, 1024 × 768, titled after the app.
- Vite only.
