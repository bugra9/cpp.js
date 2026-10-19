# JSI (vendored)

`jsi.cpp`, the out-of-line part of JSI (`facebook::jsi`), which Hermes' prebuilt framework does not export. The JSI
headers come with Hermes, so this file is taken from the same Hermes release. React Native's Android package of Hermes
carries no JSI headers, so the three `jsi.cpp` includes and the one `hermes.h` adds are in `include/jsi/`, from the
same tag.

- Upstream: https://github.com/facebook/hermes, `API/jsi/jsi/`
- Tag: `hermes-v250829098.0.17`, commit `3477757eb2475555cf8d8df24bfb1deb0613880d`
- Files, from `https://raw.githubusercontent.com/facebook/hermes/3477757eb2475555cf8d8df24bfb1deb0613880d/API/jsi/jsi/`:
  - `jsi.cpp`, sha256 `cb6274a22abc93ecc970066539815e716d3e47716e8f93a9971cf4eb5918ffc1`
  - `include/jsi/jsi.h`, sha256 `db2f1ee9291340f3d05b11abdcdc3d12ac84c239e58599d4ef2ac06dbaa14d92`
  - `include/jsi/jsi-inl.h`, sha256 `a6cbf72ee25991a25cd43049e96fb275c900e24da67d5c2b9581faaca11f06a4`
  - `include/jsi/instrumentation.h`, sha256 `1395779ad53ec372518b977d077e65a876215bc31a94cf049ed55d0a3d2426f4`
  - `include/jsi/hermes-interfaces.h`, sha256 `2cd4b50cdcdb9cf61bd5940b257d7878ceb018438cc2ea8b34acdb552d56d56d`
- License: MIT, see `LICENSE`

No local patches. A Hermes update takes these files from the new release's tag.
