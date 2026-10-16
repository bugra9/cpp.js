import { LIBRARIES_URL, PLAYGROUND_URL, TUTORIAL_URL } from '../data.js';
import { guideHref } from '../guide/nav.js';

// /tutorial/: crossbind in nine steps, one page per playground sample (src/playground/samples), each runnable in
// the page. TutorialPage.jsx is the interactive part; these blocks are what search and llms.txt see. Plain data, so
// Node can import it like every page.

const tryIt = (text) => ({ type: 'callout', title: 'Try it', text });

const STEPS = [
    {
        sample: 'hello',
        title: 'Functions and classes',
        description: 'Declare a function and a class in a C++ header and call both from JavaScript.',
        lede: 'crossbind reads your C++ header and binds the functions, classes and enums it declares. There is no glue code and no binding file: the header is the interface.',
        blocks: [
            { type: 'p', text: '`native.h` declares a function, `greet`, and a class, `Counter`; `native.cpp` defines them. Press **Run**: `main.js` imports both from the header.' },
            { type: 'p', text: 'A `std::string` crosses as a JavaScript string and an `int` as a number. The class arrives as a JavaScript class: `new Counter(41)` runs the C++ constructor, and its public methods are ordinary methods.' },
            { type: 'p', text: `\`await initNative()\` loads the module once, and every imported name works after it. A project imports the header the same way; the [quick start](${guideHref('quick-start')}) sets that up.` },
            { type: 'p', text: `The playground runs the module on the page's own thread, so a call returns its result. In a browser app, \`initNative()\` starts it in a [Web Worker](${guideHref('runtime-api')}#worker) by default, where every call returns a promise to \`await\`; \`initNative({ useWorker: false })\` runs it the way these steps do.` },
            tryIt('Add `int add(int a, int b);` to `native.h`, define it in `native.cpp`, import `add` in `main.js` and call `add(2, 3)`. Changing the C++ or the imports makes **Run** compile on the playground server; until then, a change to the rest of `main.js` runs at once.'),
        ],
    },
    {
        sample: 'numbers',
        title: 'Numbers and BigInt',
        description: 'How C++ numbers, booleans and 64-bit integers cross into JavaScript.',
        lede: '`int`, `double` and `bool` arrive as numbers and booleans. A 64-bit integer arrives as a `BigInt`, so no digit goes missing.',
        blocks: [
            { type: 'p', text: 'A JavaScript number holds integers exactly only up to 2^53. That is why `int64_t` and the other 64-bit integer types cross as `BigInt`: `fibonacci(90)` keeps all nineteen digits, while turning it into a `Number` rounds the last ones off.' },
            { type: 'p', text: 'The other way round, a 64-bit parameter takes a `BigInt`, or a `Number` that is a safe integer.' },
            { type: 'p', text: 'In the default 32-bit WebAssembly build, `long` and `size_t` are 32 bits wide, so they cross as plain numbers.' },
            tryIt('Make `fibonacci` return `double` instead of `int64_t`, in both `native.h` and `native.cpp`, and run it again: the result now loses the same digits as the `Number`.'),
        ],
    },
    {
        sample: 'strings',
        title: 'Strings and vectors',
        description: 'Strings and std::vector between C++ and JavaScript.',
        lede: 'A `std::string` is a JavaScript string. A `std::vector` that C++ returns is a vector object, which one helper copies into an array.',
        blocks: [
            { type: 'p', text: '`split` returns a `std::vector<std::string>`, which arrives as a vector object: `size()` and `get(i)` read it, and `m.toArray(vector)` copies it into an array. `m` is the module `initNative()` resolves to, which carries the helpers.' },
            { type: 'p', text: "`total` takes a `std::vector<int>`, and a function converts a plain array for it. A method's vector parameter needs a vector object, which `m.toVector('VectorInt', [1, 2, 3])` builds; the first argument names the vector type." },
            { type: 'p', text: "`split`'s separator is a `char`, which takes a one-character string." },
            { type: 'p', text: "In a browser app's default Web Worker, vectors cross as plain arrays both ways, so neither helper is needed there." },
            tryIt('Add `std::vector<int> range(int from, int to);` to `native.h`, define it in `native.cpp`, import it and print `m.toArray(range(1, 5))`.'),
        ],
    },
    {
        sample: 'structs',
        title: 'Structs and enums',
        description: 'Structs with public fields and scoped enums, used from JavaScript.',
        lede: 'The public fields of a struct become properties, and every member of an enum is there by name.',
        blocks: [
            { type: 'p', text: '`new Point()` creates a `Point` with both fields at zero, and `x` and `y` read and write like any property. `step` takes the point by value, so C++ works on a copy and returns a new point.' },
            { type: 'p', text: 'The members of `enum class Direction` are `Direction.North`, `Direction.East` and so on. They pass straight into C++, and a member that comes back is the same object, so `===` compares them.' },
            { type: 'p', text: 'A field of a number, a `bool` or a `std::string` is a property; a field of vector or class type needs accessor methods. Whatever is private stays inside C++.' },
            tryIt('Declare `Direction turnLeft(Direction direction);` in `native.h`, define it in `native.cpp` and walk the square the other way round.'),
        ],
    },
    {
        sample: 'inheritance',
        title: 'Inheritance',
        description: 'Base classes, virtual methods and derived objects across the boundary.',
        lede: 'A class hierarchy keeps its shape in JavaScript: a derived object goes wherever its base class is expected.',
        blocks: [
            { type: 'p', text: '`Circle` and `Square` derive from `Shape`, whose methods are virtual. `describe` takes a `const Shape &`; handed a `Circle`, its call to `area()` runs `Circle::area()`, as it would in C++.' },
            { type: 'p', text: '`instanceof` follows the hierarchy too: a `Circle` is a `Shape`. Single inheritance with virtual methods binds; multiple inheritance does not.' },
            { type: 'p', text: 'The hierarchy itself stays in C++: a JavaScript class cannot extend `Shape` to override its virtual methods.' },
            tryIt('Add a C++ class `Triangle` with a base and a height to `native.h` and `native.cpp`, and describe one from `main.js`.'),
        ],
    },
    {
        sample: 'callbacks',
        title: 'Callbacks',
        description: 'JavaScript functions passed to C++ through function pointers.',
        lede: 'A function pointer parameter takes a JavaScript function, and C++ calls it like any other.',
        blocks: [
            { type: 'p', text: '`countdown` calls its `Visitor` once for every number, and each call runs the arrow function from `main.js`. `applyTwice` uses what its `Transform` returns.' },
            { type: 'p', text: 'A module has 64 callback slots. Each function handed to C++ holds one until `m.releaseCallback(fn)` frees it: the same function passed again keeps its slot, while a new arrow function takes another. So release a function once C++ no longer needs it.' },
            { type: 'p', text: 'A function cannot cross into a Web Worker, so a browser app that passes callbacks runs its module on the page thread, with `initNative({ useWorker: false })`.' },
            tryIt('Pass `applyTwice` a function that squares its argument and check the result.'),
        ],
    },
    {
        sample: 'errors',
        title: 'Exceptions',
        description: 'C++ exceptions caught in JavaScript.',
        lede: 'A C++ exception reaches JavaScript as an `Error`, so `try` and `catch` work across the boundary.',
        blocks: [
            { type: 'p', text: '`parsePercent` throws `std::out_of_range` for a number outside 0 to 100, and `std::stoi` throws `std::invalid_argument` for text that is not a number. Both arrive in `main.js` as an `Error`.' },
            { type: 'p', text: 'In a WebAssembly build the message reads `<type>: <what()>`, and the two parts are also on `error.cppType` and `error.cppMessage`. Throwing is the binding-friendly way to report a failure: there are no status codes or out-parameters to check.' },
            tryIt('Call `squareRoot(-1)` outside the `try` block and see how an uncaught exception shows up.'),
        ],
    },
    {
        sample: 'rust',
        title: 'Rust',
        description: 'A Rust file imported like a header: structs, Vec, Option and Result in JavaScript.',
        lede: 'A `.rs` file imports like a header: crossbind binds its public structs and functions, so Rust sits beside C++ in one project.',
        blocks: [
            { type: 'p', text: '`words.rs` defines a struct, `Tally`, with its methods in an `impl`, and a function, `parse_score`. The struct arrives as a class whose constructor is `new`, and snake_case names arrive in camelCase: `parseScore`.' },
            { type: 'p', text: 'A `String` is a string and a `Vec` an array, with no helper, and `None` is `null`. A function that returns a `Result` returns what `Ok` holds and throws an `Err` as an `Error` with the error\'s text.' },
            { type: 'p', text: `A crate from crates.io imports the same way, as \`cargo:<crate>\`; the next step uses one, and the [Rust guide](${guideHref('rust')}) maps every type.` },
            tryIt('Give `Tally` a `pub fn shortest(&self) -> Option<String>` and print `tally.shortest()`.'),
        ],
    },
    {
        sample: 'packages',
        open: 'main.js',
        title: 'Packages',
        description: 'A crossbind port, a crate and a Conan package in one project.',
        lede: 'A library comes as a package: a crossbind port from npm, a crate from crates.io or a Conan package. The project names it in `crossbind.config.js` and imports it like its own files.',
        blocks: [
            { type: 'p', text: "`main.js` imports SQLite's own header from the `@crossbind/port-sqlite3` port, and `Version` and `VersionReq` from the `semver` crate as `cargo:semver`. A port's header binds only the functions you import." },
            { type: 'p', text: '`nlohmann_json`, the Conan package, is all C++ templates, with no function of its own to bind. `native.cpp` includes it, and `native.h` declares `pretty`, the one function JavaScript needs.' },
            { type: 'p', text: `The playground writes \`crossbind.config.js\` from the project's packages; a project of your own lists them there. [Libraries](${LIBRARIES_URL}) has every port, and the guide covers [crates.io](${guideHref('crates-io')}) and [Conan](${guideHref('conan')}).` },
            tryIt('Change `^1.2` to `>=1.0, <1.4` and run it again. To add another package, open this step in the playground and press **Add package**.'),
            { type: 'h2', id: 'next', text: 'Where to go next' },
            {
                type: 'ul',
                items: [
                    `[Quick start](${guideHref('quick-start')}): crossbind in a project of your own.`,
                    `[C++ bindings](${guideHref('bindings')}): every type, pointers and buffers, constants and memory.`,
                    `[Rust](${guideHref('rust')}) and [crates.io](${guideHref('crates-io')}): Rust files and crates.`,
                    `[Libraries](${LIBRARIES_URL}): ready-made C and C++ libraries, from SQLite to GDAL.`,
                    `[Runtime API](${guideHref('runtime-api')}), [Configuration](${guideHref('configuration')}) and [CLI](${guideHref('cli')}): \`initNative()\`, \`crossbind.config.js\` and the command line.`,
                    `[Playground](${PLAYGROUND_URL}): every sample, free to change, with more packages.`,
                ],
            },
        ],
    },
];

// The first step is the tutorial's own address; the others sit under it by sample. A step's heading is its topic
// alone, while the browser tab, search and llms.txt also say it is part of the tutorial.
export const TUTORIAL_PAGES = STEPS.map((step, index) => {
    const href = index === 0 ? TUTORIAL_URL : `${TUTORIAL_URL}${step.sample}/`;
    return {
        kind: 'tutorial',
        section: 'Tutorial',
        path: href.replace(/\/$/, ''),
        href,
        ...step,
        headTitle: `Tutorial: ${step.title}`,
        description: `${step.description} Step ${index + 1} of the crossbind tutorial.`,
    };
});
