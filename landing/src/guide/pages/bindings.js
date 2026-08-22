export default {
    slug: 'bindings',
    title: 'C++ bindings',
    description: 'The subset of C++ that binds automatically, the type table, and how to wrap the rest.',
    lede: 'There are no binding macros to write: the generator reads your header and produces the bridge. In exchange it handles a constrained subset of C++. Stay inside it and everything binds for free; step outside and you wrap the offending API in something that does.',
    blocks: [
        { type: 'h2', id: 'rules', text: 'The rules' },
        { type: 'h3', text: 'No raw pointers in the public API' },
        {
            type: 'p',
            text: 'Pointer arithmetic, ownership and aliasing have no JavaScript equivalent, so they are not exposed. Return values by value or through `std::shared_ptr`.',
        },
        {
            type: 'code',
            file: 'C++',
            code: `// will not bind
MyClass* getInstance();
void process(int* data, size_t len);
char* getName();

// binds cleanly
std::shared_ptr<MyClass> getInstance();
void process(const std::vector<int>& data);
std::string getName();`,
        },
        { type: 'h3', text: 'The public surface belongs in the header' },
        {
            type: 'p',
            text: 'The binder reads headers. A class declared in the `.h` but defined only in the `.cpp`, an anonymous namespace around the API, or a file-scope `static` function is invisible to it. Public members bind; private ones stay internal, which is fine.',
        },
        { type: 'h3', text: 'Single inheritance only' },
        {
            type: 'p',
            text: 'Single-base `virtual` polymorphism is supported. Multiple inheritance - diamonds especially - breaks the auto-binder; refactor to composition or wrap it.',
        },
        { type: 'h3', text: 'Templates need explicit instantiation' },
        {
            type: 'code',
            file: 'C++',
            code: `template<typename T> class Buffer { /* ... */ };

// name the instantiations you want in JavaScript
template class Buffer<int>;
template class Buffer<float>;`,
        },
        {
            type: 'callout',
            tone: 'warn',
            title: 'Returning unique_ptr',
            text: 'A `std::unique_ptr` returned across the boundary fails silently - the call comes back `null` or `undefined`. Use `std::shared_ptr` for anything JavaScript will own a handle to.',
        },

        { type: 'h2', id: 'types', text: 'Primitive types' },
        {
            type: 'table',
            head: ['C++', 'JavaScript', 'Note'],
            rows: [
                ['`void`', '`undefined`', ''],
                ['`bool`', '`true` / `false`', ''],
                ['`char`, `short`, `int` and unsigned forms', '`Number`', ''],
                ['`float`, `double`', '`Number`', ''],
                ['`long`, `unsigned long`, `int64_t`, `uint64_t`', '`BigInt`', 'both directions - pass `9n`, not `9`'],
                ['`std::string`', '`String`', ''],
                ['`std::optional<T>`', 'the value or `null`', 'C++17, supported on every runtime'],
                ['`emscripten::val`', 'anything', 'the untyped escape hatch'],
            ],
        },

        { type: 'h2', id: 'containers', text: 'Vectors, maps and enums' },
        {
            type: 'p',
            text: 'Vectors of the primitive types are bound under generated names - `VectorInt`, `VectorDouble`, `VectorString`, `VectorInt64` and friends. A vector of your own class follows the same rule: `std::vector<MyClass>` becomes `VectorMyClass`.',
        },
        {
            type: 'code',
            file: 'JavaScript',
            code: `const myVector = getMyVector();

for (let i = 0; i < myVector.size(); i += 1) {
    console.log(myVector.get(i));
}

const next = new VectorInt();
next.push_back(9);
setMyVector(next);`,
        },
        {
            type: 'p',
            text: 'Two module helpers convert between the two worlds when you would rather work with plain arrays:',
        },
        {
            type: 'code',
            file: 'JavaScript',
            code: `const values = m.toArray(getMyVector());    // vector -> Array
values.push(9);
setMyVector(m.toVector(VectorInt, values)); // Array -> vector`,
        },
        {
            type: 'p',
            text: 'Maps bind the same way (`MapIntInt`, `MapStringString`, `MapStringInt`, `MapIntString`), enums arrive as objects with the enumerator names as keys, and both `enum` and `enum class` are supported.',
        },
        {
            type: 'callout',
            tone: 'note',
            title: 'Worker runtimes differ slightly',
            text: 'On direct runtimes a `std::vector` return is a real vector proxy; through a worker bridge it arrives as a plain JavaScript array. `m.toArray()` accepts both shapes, so code written against it works either way.',
        },

        { type: 'h2', id: 'exceptions', text: 'Exceptions' },
        {
            type: 'p',
            text: 'Throw from C++ and catch in JavaScript - that is the binding-friendly way to report failure, rather than status codes or out-parameters.',
        },
        {
            type: 'code',
            file: 'C++',
            code: `double squareRoot(double x) {
    if (x < 0) throw std::invalid_argument("sqrt of negative");
    return std::sqrt(x);
}`,
        },
        {
            type: 'code',
            file: 'JavaScript',
            code: `try {
    m.squareRoot(-1);
} catch (e) {
    console.error(e.message);   // "std::invalid_argument: sqrt of negative"
}`,
        },
        {
            type: 'p',
            text: 'On wasm the message is `"<type>: <what()>"`, with the halves also available as `e.cppType` and `e.cppMessage`. On React Native (JSI) it is the plain `what()` text.',
        },

        { type: 'h2', id: 'memory', text: 'Memory' },
        {
            type: 'p',
            text: 'There is no `.delete()` to call. Because no raw pointers cross the boundary, lifetime stays on the C++ side: destructors and `shared_ptr` reference counting do the work. Objects you hand to JavaScript are freed when the last reference goes away.',
        },

        { type: 'h2', id: 'wrapper', text: 'Wrapping what does not fit' },
        {
            type: 'p',
            text: 'Vendored library full of raw pointers, templates and multiple inheritance? Do not fight it - put a clean class in front of it. The wrapper is what binds; the upstream type stays internal.',
        },
        {
            type: 'code',
            file: 'src/native/wrapper.h',
            code: `#pragma once
#include "upstream/upstream.h"
#include <memory>
#include <vector>

class CleanWrapper {
public:
    CleanWrapper();
    std::vector<float> process(const std::vector<float>& input);
private:
    std::shared_ptr<upstream::RawType> raw_;
};`,
        },
        {
            type: 'p',
            text: 'App-side wrappers live in your own `src/native`; if you are publishing a package, put the wrapper inside the package so every consumer benefits.',
        },

        { type: 'h2', id: 'typescript', text: 'TypeScript' },
        {
            type: 'p',
            text: 'Declarations are generated for every header and Rust import, outside your source tree under `.crossbind/`. Add the shared config as a dev dependency and extend it once:',
        },
        {
            type: 'code',
            file: 'tsconfig.json',
            code: '{ "extends": "@crossbind/typescript-config" }',
        },
        {
            type: 'p',
            text: 'Running with `initNative({ useWorker: true })`? Set `dts: \'promise\'` in `crossbind.config.js` so every generated signature returns `Promise<...>`, matching the async runtime - and write `await new X(...)` for construction.',
        },

        { type: 'h2', id: 'escape', text: 'The escape hatch' },
        {
            type: 'p',
            text: 'When neither the rules nor a wrapper fit, hand-write a SWIG interface file next to the header and import it from JavaScript. It is also how you register a container the generator does not cover:',
        },
        {
            type: 'code',
            file: 'src/native/mycustom.i',
            code: `#pragma once

%module mycustom

%{
EMSCRIPTEN_BINDINGS(mycustom) {
    emscripten::register_vector<Abc>("VectorAbc");
}
%}

%feature("shared_ptr");
%feature("polymorphic_shared_ptr");`,
        },
        { type: 'code', file: 'src/index.js', code: "import './native/mycustom.i';" },
    ],
};
