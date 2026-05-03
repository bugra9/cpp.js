<!--
Thanks for contributing to cpp.js! Fill in each section below — the test plan and
risk fields are not optional. If an AI agent helped draft this PR, mention it
under "Agent assistance" so reviewers know what to verify.
-->

## Summary

<!-- 1-3 bullets explaining what changed and why. Link issues with "Closes #N". -->

-

## Scope of change

<!-- Tick everything this PR touches. Use this to pick the right validation gate. -->

- [ ] `cppjs-core/cpp.js/` (CLI / build orchestration)
- [ ] `cppjs-plugins/*` (bundler / RN integration)
- [ ] `cppjs-packages/*` (a single package family)
- [ ] `cppjs-samples/*`
- [ ] `website/` (docs)
- [ ] `scripts/` (repo tooling)
- [ ] CI (`.github/workflows/`)
- [ ] Other: ___

## Test plan

<!-- Describe what you actually ran. Reviewer should be able to reproduce. -->

Validation matrix executed:

- [ ] `pnpm run check` (dist + dep + native version snapshot)
- [ ] `pnpm --filter=@cpp.js/package-<name>* run build` (touched packages)
- [ ] `pnpm run ci:linux:build` (core / plugin changes)
- [ ] `pnpm run e2e:dev` (core / plugin changes)
- [ ] `pnpm run e2e:prod` (core / plugin changes)
- [ ] Manual smoke against sample(s): ___
- [ ] Other: ___

Output of the most relevant command (paste a short snippet, errors highlighted):

```
<!-- paste relevant log -->
```

## Risk

<!-- What could break? Who is the blast radius? -->

- **Blast radius**: <!-- single package / all packages / one plugin / runtime / docs only -->
- **Backward compat**: <!-- breaking? deprecation needed? config schema changed? -->
- **Native version touched**: <!-- yes/no — if yes, link upstream changelog -->
- **iOS / arm64e / simulator slice changes**: <!-- yes/no — explain -->
- **Multithread / COOP-COEP affected**: <!-- yes/no -->

## Notes for reviewers

<!-- Anything reviewers should look at first. Open questions. Things you want a
second pair of eyes on. -->

## Agent assistance

<!-- If an AI coding agent (Claude Code, Cursor, Codex, …) drafted any part of
this PR, name it and describe what it did. Reviewers will pay extra attention
to: schema changes, CI workflow edits, git config, version bumps, publish
scripts, security-sensitive code. -->

- [ ] Agent assisted with this PR (name: ___)
- [ ] No AI agent involvement
