// Types for the bare `cpp.js` specifier, which the bundler plugins resolve to the generated
// runtime module. An ambient `declare module` loses to the real cpp.js package on disk (the
// Node-side build API), so tsconfig maps the specifier here through `paths` instead.
export function init(config?: Record<string, unknown>): Promise<unknown>;
/** @deprecated Use `init`. Kept so code written against the per-module export keeps working. */
export function initCppJs(config?: Record<string, unknown>): Promise<unknown>;
export let AllSymbols: Record<string, unknown>;
