# Lifecycle & TypeScript notes

> Two short topics in one doc, because each is small enough not to deserve its own.

## Memory & object lifecycle: there's nothing to manage in JS

cpp.js doesn't expose raw pointers across the JS↔C++ boundary (see [`cpp-binding-rules.md`](./cpp-binding-rules.md) Rule 1). Because of that, **you don't call `m.delete()` or release any C++ object from JS**. The lifecycle is entirely C++-side:

- Objects passed by value to JS get copied; the C++ original is destroyed normally.
- Objects returned as `std::shared_ptr<T>` are reference-counted. JS holds a strong reference; when JS-side reference goes out of scope (garbage collected), the shared_ptr count drops, and C++ destructor runs when the count hits zero.
- `std::vector<T>`, `std::string`, `std::map<K,V>` and similar containers are converted to JS-side equivalents on the boundary; their C++ memory is reclaimed at conversion time.
- Embind objects (when JS holds a vector/struct proxy) are auto-released when the JS reference is GC'd. You don't track them.

### Things you do NOT do

```js
const v = m.someFunc()    // returns a vector
const arr = m.toArray(v)
v.delete()                 // ❌ NOT a thing in cpp.js
```

The auto-binder doesn't expose `.delete()` because there's no raw pointer to clean up. If you see `.delete()` patterns in stock embind tutorials, ignore them — those are for raw embind, not cpp.js.

### When C++ has a long-lived resource

If your C++ class wraps a file handle, GPU buffer, network socket, etc., model it C++-side with RAII:

```cpp
class FileReader {
  public:
    FileReader(const std::string& path) : fp_(std::fopen(path.c_str(), "r")) {}
    ~FileReader() { if (fp_) std::fclose(fp_); }   // RAII closes on destruction
    std::string readAll();
  private:
    FILE* fp_;
};
```

JS:

```js
const reader = new m.FileReader('/memfs/myapp/data.txt')
const text = reader.readAll()
// reader is GC'd later → C++ destructor runs → fclose runs.
```

If you need deterministic close (don't wait for GC), expose an explicit `close()` method on the C++ class and call it from JS. That's the binding-friendly pattern.

### Reference cycles

Standard JS rules apply. If a JS proxy of a C++ shared_ptr captures a closure that holds the same proxy, you have a cycle that GC won't break. Solution: same as in regular JS — don't capture self-references in long-lived closures, or break the cycle explicitly when done.

## TypeScript: `.d.ts` is not auto-generated (yet)

cpp.js does not currently emit `.d.ts` files for your bindings. If you import from a generated `.h` JS module in a TypeScript project, the imported symbols will be `any`.

### What you can do

1. **Hand-write a `.d.ts`** — the most precise option. Mirror your binding API in TypeScript:

   ```ts
   // src/native/native.d.ts
   export interface Module {
       FS: any
       Matrix: new (rows: number, cols: number) => Matrix
       processData(input: number[]): number[]
       toArray<T>(vec: T): T[]
       toVector<T>(cls: string | (new () => T), arr: T[]): T
   }
   export interface Matrix {
       rows: number
       cols: number
       get(i: number, j: number): number
   }
   export function initCppJs(opts?: { useWorker?: boolean; fs?: { opfs?: boolean } }): Promise<Module>
   ```

2. **Use JSDoc on the import line** — minimal but lossy:

   ```ts
   // @ts-expect-error — cpp.js generated module has no types
   import { initCppJs } from './native/native.h'
   ```

3. **Wrap the bound module in a typed facade** — gives you compile-time safety on the surface you care about:

   ```ts
   import { initCppJs as _init } from './native/native.h'

   interface MyApp {
       sqrt(x: number): number
       process(data: number[]): number[]
   }

   export async function init(): Promise<MyApp> {
       return await _init() as MyApp
   }
   ```

### Why no auto-gen yet?

The generator emits SWIG-compatible C++ → JS bindings; the SWIG → TS step isn't wired. It's on the roadmap but not shipped — track it via GitHub issues.

### Heads-up for agents

When integrating cpp.js into a TypeScript project, **don't promise `.d.ts` autocomplete**. Tell the user up front: "cpp.js bindings come without types; you'll either get `any` or you write a small `.d.ts` for the surface you care about". The wrapped-facade pattern is usually the cleanest.

## See also

- [`cpp-binding-rules.md`](./cpp-binding-rules.md) — why no raw pointers means no manual deletion.
- [`init.md`](./init.md) — `Module` shape, helper methods.
- [`filesystem.md`](./filesystem.md) — long-lived FS resources (mounts, OPFS handles).
