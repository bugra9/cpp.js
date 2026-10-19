# Apps — `target.runtimeEnv: 'app'`

> A desktop app whose page runs in the system webview and whose bindings run natively in the app's own process, with
> no Node.js and no browser engine of its own. macOS and Linux for now; iOS and Android follow.

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
| `vite` | Builds the host for this machine and opens the app on the dev server. An edit to the page reloads it; an edit to native code, or to what the page imports from it, rebuilds the host and opens the app again. The page's console shows in the terminal, and closing the window ends the session. |
| `vite build` | Builds the page and the host and writes the app: `dist/<name>.app`, signed ad hoc, on macOS; `dist/<name>-linux-<arch>/` and the same as a `.tar.gz` on Linux. |
| `crossbind build -p host -e app` | Builds the host alone, with no page in it: `<paths.output>/<name>.darwin-<arch>.app` on macOS, `<paths.output>/<name>.linux-<arch>` and its `.tar.gz` on Linux. `-p linux` builds a Linux app from a Mac as well. |

The first build fetches Hermes once, and on Linux WebKitGTK's headers and libraries too (see [Hermes](#hermes)).

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

<name>-linux-<arch>/
├── <name>                        the window, the webview, Hermes and the bindings, in one executable
└── resources/                    host.hbc, page/ and data/, as on macOS
```

The sample app is 6.7 MB on disk and 1.8 MB zipped (arm64): a 0.8 MB host and a 6 MB Hermes. It shows its first
native result 0.34 s after launch on an M-series Mac. A Linux app links Hermes into its executable and runs on the
system's WebKitGTK.

## Security

- The webview loads `crossbind://app` alone, in any frame; during development, the dev server too. A frame from
  another origin would reach the module's channel and its `crossbind://` requests, so none is loaded. A link the user
  follows to another page opens in the default browser, and any other navigation away is refused.
- The host gives the top frame of its page a token, and every message to the module and every call that travels as a
  `crossbind://` request carries it. Markup, such as an image, a frame from another origin and a sandboxed frame
  cannot read it, so none of them reaches the module. On macOS the channel also checks the sender's origin, which
  WebKitGTK does not tell.
- Responses from `crossbind://` let another origin read them only during development, when the page comes from the
  dev server.
- Only the debug host the dev server opens reads `CROSSBIND_APP_URL`; a release build always loads its own page.

## Hermes

The host runs React Native's Hermes for Apple platforms, release `250829098.0.17`. The first build downloads it from
Maven Central into `~/.crossbind/hermes/` and checks it against the sha256 crossbind pins.

Linux has no published Hermes: the first Linux build compiles the same release from its source, pinned by sha256, in
crossbind's linux image, once per machine and arch, in a few minutes. The host builds in that image too, with its
static libc++, against the WebKitGTK 4.1 headers and libraries of Ubuntu 22.04's packages. The first build downloads
those from Launchpad into `~/.crossbind/sysroots/` and checks each against the sha256 crossbind pins
(`src/assets/webkitgtk-sysroot.txt`); the app itself runs on the system's WebKitGTK.

`crossbind licenses -e app` lists what the app carries beside its packages: crossbind's runtime, Hermes, JSI's
`jsi.cpp` from the same release and webview/webview, each with its version, its sha256 and its license text; with
`-p linux`, the Hermes source and the libc++ a Linux app links. `--notices` writes them to a file to ship with the
app.

## Environment variables of the app

| Variable | Effect |
|---|---|
| `CROSSBIND_APP_URL` | Opens this page instead of `crossbind://app/`, in a debug build only; the Vite plugin sets it to the dev server. |
| `CROSSBIND_APP_CONSOLE` | Writes the page's console and uncaught errors to the app's output; on during development. |

## Limits

- macOS 11 or later, built on macOS.
- Linux: a glibc system with WebKitGTK 4.1, release 2.40 or later (`libwebkit2gtk-4.1-0` on Debian and Ubuntu),
  measured on Ubuntu 22.04. A Linux app builds in crossbind's linux image, so it needs Docker (`RUNNER=DOCKER_RUN` or
  `DOCKER_EXEC`), on a Mac as well.
- The ad hoc signature opens the app on the Mac that built it. Developer ID signing and notarization are not wired yet.
- One window, 1024 × 768, titled after the app.
- Vite only.
