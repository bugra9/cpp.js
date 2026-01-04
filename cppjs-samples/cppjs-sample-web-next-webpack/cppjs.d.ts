declare module '*.h' {
  export function initCppJs(config?: {
    jsPath?: string;
    wasmPath?: string;
    paths?: { wasm?: string; data?: string; worker?: string; js?: string };
    env?: Record<string, string>;
  }): Promise<any>;
  export const Native: any;
  export const AllSymbols: any;
  const _default: any;
  export default _default;
}
