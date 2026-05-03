---
name: New C++ library package request
about: Request that a specific C++ library be packaged for cpp.js
title: 'package: add <library-name>'
labels: ['package-request', 'needs-triage']
---

## Library

- **Name**: <!-- e.g. libsodium, FreeType, libsndfile -->
- **Upstream URL**: <!-- repo / homepage -->
- **License**: <!-- MIT / Apache-2.0 / LGPL / proprietary / unknown -->
- **Build system**: <!-- CMake / autotools / Make / scons / other -->
- **Latest stable version**: <!-- e.g. 1.20.4 -->

## Why this library

<!-- What problem does it solve? Why is JavaScript-via-cpp.js valuable here? -->

## Targets needed

- [ ] WebAssembly (browser / Node / edge)
- [ ] iOS
- [ ] Android

## Known dependencies

<!-- C++ libraries this depends on (e.g. zlib, openssl). If they're already in
cpp.js, link the existing @cpp.js/package-* packages. If not, list them so we
know the full graph. -->

-

## API surface to expose

<!-- A handful of functions / classes you'd want callable from JavaScript.
Helps us estimate Embind/SWIG bridge work. -->

```cpp
// e.g.
// const std::string libsodium_version();
// int crypto_sign_detached(unsigned char *sig, ...);
```

## Are you willing to package it yourself?

<!-- See docs/playbooks/new-package.md. We strongly encourage you to start in
your own org or on the cppjs-community org and PR upstream once it works.
GDAL-affecting packages can land directly here. -->

- [ ] Yes, I'll author the package and open a PR.
- [ ] I can help test, but not author.
- [ ] Looking for someone else to package it.

## Additional context

<!-- Existing JS bindings (and why they're insufficient), benchmarks,
licensing concerns, anything else. -->
