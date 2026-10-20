# WebView2 SDK (license only)

A Windows host compiles against `WebView2.h` and `WebView2EnvironmentOptions.h` of Microsoft's WebView2 SDK, whose
interface IDs it carries. crossbind's windows image has the headers in `/opt/crossbind/webview2/include`
(`tooling/docker/windows.Dockerfile`); this folder keeps the SDK's license, which `crossbind licenses` quotes.

- Upstream: https://www.nuget.org/packages/Microsoft.Web.WebView2
- Version: `1.0.4258.31`, `https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/1.0.4258.31/microsoft.web.webview2.1.0.4258.31.nupkg`,
  sha256 `56f7f4b8bf9aee4b8efefbbdd4f67d5f74ebd1b100ed0806da71bf76af481aa9`
- License: BSD-3-Clause, see `LICENSE`, the package's `LICENSE.txt`

webview/webview loads the WebView2 Runtime itself, so an app carries no `WebView2Loader.dll`. An SDK update changes the
image and this folder together.
