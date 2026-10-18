# @crossbind/example-desktop-app
**crossbind desktop app sample**

A macOS app whose page runs in the system webview and whose C++ runs natively in the app: crossbind builds
`src/native` and the matrix library into the app's own host, and the page calls it with the same `initNative()` and
awaited calls as a web build that runs its module in a worker. There is no Node.js and no browser engine in the app;
the page uses the one macOS ships.

# Getting Started

>**Note**: Make sure you have completed the [crossbind - Prerequisites](https://crossbind.dev/docs/guide/getting-started/prerequisites) instructions.
Apps build on macOS with Xcode's command line tools; the bindings are generated in Docker. The first build downloads
React Native's Hermes for Apple platforms once into `~/.crossbind/hermes`.

## Setup

Install the dependencies:

```bash
pnpm install
```

Inside the crossbind repository, build the library's archives for macOS first:
`pnpm --filter @crossbind/example-lib-prebuilt-matrix run build:desktop`.

## Get Started

```bash
pnpm dev
```

opens the app on Vite's dev server: edits to the page reload it, edits to the C++ rebuild the app and open it again,
and the page's console shows in the terminal. Closing the window ends the session.

## Build

```bash
pnpm build
```

writes the app to `dist/crossbind-example-desktop-app.app`, signed ad hoc, so it opens on the Mac that built it.

## Test

`pnpm run e2e:prod` opens the built app and waits for the page to log the result.
