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
