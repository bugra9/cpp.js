# webview (vendored)

A header-only C++ library that opens a window with the system webview: WKWebView on macOS, WebKitGTK on Linux and
WebView2 on Windows. The app host makes its window with it.

- Upstream: https://github.com/webview/webview
- Commit: `cbbdee44afff22867de9fd88a9fc8350d9bdd399` (master on 9 March 2026; the last tag, 0.12.0, dates from 2024)
- Archive: `https://codeload.github.com/webview/webview/tar.gz/cbbdee44afff22867de9fd88a9fc8350d9bdd399`,
  sha256 `10e972a2327b5681474f4aa4499e505eaa4ff659aa995380386f08fd6fc1b763`
- License: MIT, see `LICENSE`

Only `core/include` is kept.

## Local patches

- `detail/backends/cocoa_webkit.hh` calls `cocoa_configure_hook`, when one is set, with the `WKWebViewConfiguration`
  before the `WKWebView` is made from it. A URL scheme handler can be registered only then, and the host serves the
  page and large bodies from `crossbind://`. Upstream tracks this as issue #851; PRs #955 (WebKitGTK only) and #1370
  are open.
- `detail/backends/win32_edge.hh` makes WebView2's environment with the options `win32_environment_options_hook`
  returns, when one is set, instead of none: WebView2 takes custom URL schemes from those options alone.
- `detail/backends/cocoa_webkit.hh` sizes the window's content in `set_size`, not its frame, as the other backends do:
  the app's window opens with the page size crossbind.config.js gives.
- `detail/backends/win32_edge.hh` takes the minimum and maximum sizes as the content's, in logical pixels, as the size
  itself, and turns them into frame sizes at the window's DPI when Windows asks; upstream passed the numbers to Windows
  as frame pixels.
- `detail/platform/windows/dpi.hh` counts a window's menu bar in its frame, so the page's minimum size and its size
  after a change of DPI leave the bar out, as the size `set_size` gives does.
- `detail/native_library.hh` loads a library named without a path from System32 alone. webview first tries
  `WebView2Loader.dll`, which no crossbind app ships, so otherwise a copy in the working directory or on `PATH` would
  load into the app.
