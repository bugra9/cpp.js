# ADR-0017: Build desktop and mobile apps on an own host: the system webview, Hermes and embind-jsi

- **Status:** Proposed
- **Date:** 2026-10-18
- **Affects:** `core/app-host/`, `core/crossbind/src/actions/{buildApp,nativeBridges,xcodeProject,iosSimulator}.js`, `src/utils/{targets,hermes,resolveAppHost}.js`, `src/integration/getCrossbindScript.js`, `plugins/{rollup,vite}`, `examples/desktop-app`, `e2e/desktop-app`

## Context

A crossbind project already runs its bindings in the browser as wasm, in Node.js and Electron as an addon
(ADR-0011), and in React Native over JSI. An app with a web page and native code still meant Electron (125 MB zipped)
or a host written by hand around the bindings.

A spike on 18 October 2026 measured an own host against Electron 44.7, Tauri 2.12.4 and Electrobun 2.0.2 on one Mac,
with the full conformance kit running through it:

- A call takes 72 µs from the page and back, against 46 µs in Electron and 156 µs in Tauri; 1 MiB goes in and out
  in 0.67 and 0.5 ms (Electron 0.65 and 0.45, Tauri 0.33 each way).
- The shell and Hermes zip to 1.8 MB, like Tauri's 1.9 MB.
- The same host core ran on WebKitGTK, in the iOS Simulator and in the Android emulator, at 300 of 301 checks.

embind needs a JavaScript runtime for its registry and `val`, so a host without one would need a new binding
backend. Hermes implements JSI, which embind-jsi already targets for React Native and Node.js.

## Decision

An app is a page in the system webview and a host process that runs the project's bindings in Hermes on a thread of
its own. `target.runtimeEnv: 'app'` selects it: the Vite plugin then builds the host and drives development and
packaging, and `crossbind build -e app` builds the host alone.

- The page reaches the module through a lean protocol: one webview message per call, with the contract a
  worker-backed web build has (handles released by the page's garbage collector, enum identity, vectors as arrays,
  errors with their fields). Byte arrays from 16 KiB and results from 4 KiB travel as `crossbind://` request and
  response bodies.
- The bindings compile against the JSI of the Hermes the host links, in an archive of their own (`AppBridge`).
- Hermes comes from React Native's published releases, pinned by version and sha256: `hermes-ios` for macOS and iOS,
  `hermes-android` for Android. Linux builds the release's source in crossbind's linux image, with the static libc++
  the host and the project's archives share there, since JSI hands std types across; Windows will build its own too.
- The desktop window comes from webview/webview, vendored with a patch that registers the URL scheme; mobile apps get
  generated Xcode and Gradle projects.
- An iOS app is an Xcode project crossbind writes anew on every build. The host, with a UIKit scene and the macOS
  channels, and every archive it links come prebuilt for each SDK; the project only links them from a stub `main`,
  embeds Hermes and copies the app's files, so it is relocatable and holds nothing to edit. Its bundle id and team
  come from `crossbind.config.js`. Vite builds it when `CROSSBIND_APP_PLATFORM=ios` and runs it in the Simulator
  during development.
- The webview loads the app's own origin alone, in every frame (and the dev server during development); the module's
  channel answers that origin only. Measured: a frame from another origin otherwise reaches the `crossbind://` routes
  even where a message's origin is checked. The host also gives the page's top frame a token that every message and
  `crossbind://` call carries: markup and sandboxed frames of the app's own page reach the channel and the routes too,
  and WebKitGTK does not tell a message's sender (measured).
- macOS, Linux and iOS first. A Linux app builds against the WebKitGTK 4.1 of Ubuntu 22.04's packages and runs on the
  system's; an iOS app needs iOS 15.1, as Hermes does; Android requires System WebView 116, the first with
  ArrayBuffer messages.

## Consequences

- **Positive** — The page of a web build becomes an app with no change to its calls. An app is small (the sample:
  1.8 MB zipped) and shows its first native result 0.34 s after launch. Ports, the bundler plugin, the scaffolder and
  the license tooling carry over.
- **Positive** — One host core serves desktop and mobile; only the window, the webview's channels and packaging differ
  per platform.
- **Negative** — crossbind now owns a host: window behaviour, packaging, signing and updates, per platform. Each
  platform's webview differs (WebKit, WebKitGTK, Android WebView, WebView2).
- **Negative** — The page cannot pass JavaScript functions to the module, as in a worker-backed web build, and every
  call is asynchronous.
- **Negative** — A patched fork of webview/webview to maintain until upstream takes a scheme hook (issue #851).

## Alternatives considered

- **Electron alone** — Already supported (ADR-0011, `examples/desktop-electron`) and kept; 125 MB zipped and no
  mobile story.
- **A Node.js host with a webview (wry over Node-API)** — Carries Node.js into every app and splits it into two
  runtimes. Rejected.
- **A Rust host like Tauri's** — embind still needs a JavaScript runtime, so the host would embed one anyway.
- **wasm inside the webview** — What the web build already is; no native speed or system access.
- **CEF** — 126 MB and more per platform, compressed.
- **Checking the sender's origin instead of a navigation lock** — Measured insufficient: requests to `crossbind://`
  from a foreign frame run their call even when CORS hides the answer.

## See also

- Related ADRs: ADR-0011 (Node-API addons), ADR-0006 (Rust bindings)
- Related code: `core/app-host/`, `core/crossbind/src/actions/buildApp.js`, `plugins/vite/index.js`
- Reference: `docs/api/app.md`, `docs/playbooks/integration/desktop-app.md`
