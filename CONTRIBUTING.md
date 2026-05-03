# Contributing to cpp.js

Thanks for considering a contribution. cpp.js is small and friendly — a few simple conventions keep it that way.

> All contributions are licensed under the [MIT License](./LICENSE), the same license cpp.js itself ships under. Submitting a PR confirms you have the right to license your contribution under MIT. There is **no separate CLA** to sign.

## Quick start

```bash
git clone https://github.com/bugra9/cpp.js.git
cd cpp.js
pnpm install
pnpm run doctor       # verify Node, pnpm, Docker, NDK, Xcode
pnpm test             # unit tests (Vitest)
pnpm run build        # full build (long; pick a filter for faster iteration)
```

For day-to-day iteration, scope your build to the touched package:

```bash
pnpm --filter @cpp.js/package-zlib-wasm run build       # one sub-arch
pnpm --filter '@cpp.js/package-zlib*' run build          # one family
pnpm --filter @cpp.js/sample-web-vue-vite dev            # one sample
```

## Where things live

See [`docs/CODEMAP.md`](./docs/CODEMAP.md) for the concept→file map and [`AGENTS.md`](./AGENTS.md) for the project mental model. Quick navigation:

| Want to | Look at |
|---------|---------|
| Add a new prebuilt C++ library | [`docs/playbooks/new-package.md`](./docs/playbooks/new-package.md) |
| Fix a bug | [`docs/playbooks/bug-fix.md`](./docs/playbooks/bug-fix.md) |
| Understand the build pipeline | [`docs/api/build-state.md`](./docs/api/build-state.md), [`docs/api/overrides.md`](./docs/api/overrides.md) |
| Author runtime API | [`docs/api/init.md`](./docs/api/init.md), [`docs/api/cppjs-config.md`](./docs/api/cppjs-config.md) |
| Understand a load-bearing decision | [`docs/adr/`](./docs/adr/) |

## Branch naming

```
feat/<short-desc>          # new feature
fix/<short-desc>           # bug fix
refactor/<short-desc>      # internal cleanup, no behavior change
docs/<short-desc>          # docs / playbooks / READMEs only
chore/<short-desc>         # tooling, deps, CI
package/<name>             # changes to a single cppjs-package-*
```

Examples: `feat/agent-ready`, `fix/vite-hmr-paths-native-array`, `package/libsodium`.

## Commit messages

Conventional commits. Type prefix + colon + short imperative summary, optionally with a scope:

```
feat: add libsodium prebuilt package
fix(plugin-vite): iterate paths.native array instead of fs.existsSync on it
docs(api): document targetSpecs.specs field-by-field
refactor(cpp.js/state): collapse runtime adapters into core.js
chore: bump pnpm to 10.33.2
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

Body and footers optional — use them when the change needs context the diff doesn't show. Wrap at ~72 chars. Reference issues with `Closes #123`.

## Code style

- **JavaScript / TypeScript**: Prettier-formatted (4-space indent, single quotes, no trailing semicolons in some files — let Prettier decide). Run `pnpm prettier --write <files>` before committing if your editor doesn't auto-format.
- **C++**: 4-space indent, `lower_snake_case` for functions/methods, `PascalCase` for classes. Match the style of nearby files.
- **No `console.log`** in committed code. Use the cpp.js `logger` (`cppjs-core/cpp.js/src/utils/logger.js`) for build-time output, or `print`/`printErr` hooks via `initCppJs` for runtime.

## Tests

We use **Vitest** for unit tests. New utilities or build helpers should ship with tests:

```bash
pnpm test                 # run all unit tests (root)
pnpm test:watch           # watch mode
pnpm test:coverage        # coverage report
```

Test files live in `cppjs-core/cpp.js/test/*.test.js`. Aim for AAA structure (Arrange / Act / Assert) and synthetic inputs only — no production data, no real network.

For build-pipeline changes, the validation matrix in [`AGENTS.md`](./AGENTS.md) tells you which builds to verify (e.g. core change → at least one wasm + one ios + one android package).

## Pull requests

1. **Open against `main`.** No long-lived feature branches.
2. **One topic per PR.** "Add libsodium" is one PR; "Add libsodium and refactor logger" is two.
3. **Fill the [PR template](./.github/PULL_REQUEST_TEMPLATE.md)** — Summary, Scope, Test plan, Risk, Agent assistance. The Test plan is not optional; reviewers use it to know what to re-run locally.
4. **Wait for CI green.** GitHub Actions runs the matrix. Don't ask for review until checks pass.
5. **Review pace:** the maintainer aims for first-pass response within a few days. Ping the PR if a week has passed in silence.

For larger changes (new package family, new bundler plugin, architectural shift), open an issue first to align on the approach. Avoids surprise rewrites at review time.

## Issues

Three templates in `.github/ISSUE_TEMPLATE/`: **Bug**, **Feature**, **New package**. Pick the one that fits.

Bug reports need: cpp.js version, package(s) affected, reproducer (smallest possible), what you observed, what you expected. "Doesn't work" without a reproducer will be closed with a request for one.

## Releases

cpp.js uses **manual semver releases**. Beta tag for in-development, latest for stable.

```bash
pnpm run check                      # full health check
pnpm run publish:all                # publish core + mcp + plugins + samples
# or piecewise:
pnpm run publish:core               # cpp.js
pnpm run publish:mcp                # @cpp.js/mcp
pnpm run publish:plugins            # @cpp.js/plugin-*
pnpm run publish:samples            # @cpp.js/sample-*
pnpm run publish:beta               # all under @cpp.js/* with --tag beta
```

Releases are maintainer-driven. Contributors don't need to bump versions in their PRs — that happens at release time.

## AI agents are welcome

If you're using an AI coding agent (Claude Code, Cursor, Codex, …), great — cpp.js is built to be agent-friendly. Two notes:

- The agent should mention itself in the PR's "Agent assistance" section. Reviewers like to know what to spot-check.
- Agents must not commit, push, tag, or open PRs autonomously. The human contributor reviews and ships. (See `AGENTS.md` "Never" section.)

Plugin + MCP install: see [`cpp.js.org/docs/agent/overview`](https://cpp.js.org/docs/agent/overview).

## Code of Conduct

Be kind, be specific, assume good faith. Disagreements about technical direction get hashed out in the issue or PR thread, not over email or DM. If something feels off, contact the maintainer privately first — public escalations rarely help.

## Questions

- Bugs / feature requests → [GitHub Issues](https://github.com/bugra9/cpp.js/issues)
- General questions → open a [Discussion](https://github.com/bugra9/cpp.js/discussions)
- Security issues → see `SECURITY.md` if present, otherwise email the maintainer privately (don't open a public issue).

Thanks for being here. Have fun.
