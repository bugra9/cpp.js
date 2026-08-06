# Licenses
```bash
Usage: cppjs licenses [options]

list bundled native dependencies with SPDX license, versions and source URL

Options:
  --notices [file]       write a THIRD-PARTY-NOTICES markdown file (default: THIRD-PARTY-NOTICES.md)
  --sbom [file]          write a CycloneDX SBOM json file (default: sbom.cdx.json)
  --check                exit non-zero when a license field is missing or not valid SPDX
  --platform <platform>  also list what this platform's artifact statically links beyond
                         the package graph (vendored copies, toolchain runtime)
  -h, --help             display help for command
```

Run inside any project or package that uses Cpp.js dependencies. The plain
command prints one row per bundled native library: SPDX license expression,
native version and the pinned source URL, with copyleft entries flagged.

**`--notices`** generates a `THIRD-PARTY-NOTICES.md` with the full license
texts, pulled from each package's upstream source tree — nothing is
hand-written. **`--sbom`** emits the same rows as a CycloneDX document with
source hashes. Rows are derived from the resolved dependency graph, so the
output is correct per variant (platform, dependency set, features) rather
than per package name.

**`--platform wasi`** additionally includes what the artifact statically
links beyond the package graph: vendored third-party copies the recipes
declare (for example GDAL's internal codecs) and the toolchain runtime
(wasi-libc and the LLVM runtimes), with source links pinned to the exact
toolchain in use.

**`--check`** is the CI guard: it exits non-zero when any bundled
dependency's license metadata is missing or not valid SPDX.
