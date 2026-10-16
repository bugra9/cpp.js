import { LIBRARIES_URL, PLAYGROUND_URL, TUTORIAL_URL } from '../data.js';
import { guideHref } from '../guide/nav.js';

// /tutorial/: crossbind in seven steps, one page per playground sample (src/playground/samples), each runnable in
// the page. TutorialPage.jsx is the interactive part; these blocks are what search and llms.txt see. Plain data, so
// Node can import it like every page.

const tryIt = (text) => ({ type: 'callout', title: 'Try it', text });

const STEPS = [
    {
        sample: 'hello',
        title: 'Functions and classes',
        description: 'Declare a function and a class in a C++ header and call both from JavaScript.',
        lede: 'crossbind reads your C++ header and binds everything it declares. There is no glue code and no binding file: the header is the interface.',
        blocks: [
            { type: 'p', text: '`native.h` declares a function, `greet`, and a class, `Counter`; `native.cpp` defines them. Press **Run**: `main.js` imports both from the header.' },
            { type: 'p', text: 'A `std::string` crosses as a JavaScript string and an `int` as a number. The class arrives as a JavaScript class: `new Counter(41)` runs the C++ constructor, and its methods are ordinary methods.' },
            { type: 'p', text: `\`await initNative()\` loads the module once, and every imported name works after it. A project imports the header the same way; the [quick start](${guideHref('quick-start')}) sets that up.` },
            tryIt('Add `int add(int a, int b);` to `native.h`, define it in `native.cpp`, import `add` in `main.js` and call `add(2, 3)`. A change to the C++ or to the imports compiles on the playground server; any other change to `main.js` runs right away.'),
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
            tryIt('Make `fibonacci` return `double` instead of `int64_t`, run it again and compare the last digits with the `BigInt` result.'),
        ],
    },
    {
        sample: 'strings',
        title: 'Strings and vectors',
        description: 'Strings and std::vector between C++ and JavaScript.',
        lede: 'A `std::string` is a JavaScript string. A `std::vector` is a vector object, with two helpers that turn it into an array and back.',
        blocks: [
            { type: 'p', text: '`split` returns a `std::vector<std::string>`, which arrives as a vector object: `size()` and `get(i)` read it, and `m.toArray(vector)` copies it into an array. `m` is the module `initNative()` resolves to, which carries the helpers.' },
            { type: 'p', text: "`total` takes a `std::vector<int>`, so it needs a vector object too. `m.toVector('VectorInt', [1, 2, 3, 4])` builds one from an array; the first argument names the vector type." },
            { type: 'p', text: 'In an app, `initNative()` runs the module in a Web Worker by default. Every call returns a promise there, and plain arrays are converted for you. The playground runs the module without a worker, so calls return their results directly and vectors take the helpers.' },
            tryIt('Add `std::vector<int> range(int from, int to);`, import it and print `m.toArray(range(1, 5))`.'),
        ],
    },
    {
        sample: 'structs',
        title: 'Structs and enums',
        description: 'Structs with public fields and scoped enums, used from JavaScript.',
        lede: 'The public fields of a struct become properties, and every member of an enum is there by name.',
        blocks: [
            { type: 'p', text: '`new Point()` creates a `Point`, whose `x` and `y` read and write like any property. `step` takes the point by value, so C++ works on a copy and returns a new point.' },
            { type: 'p', text: 'The members of `enum class Direction` are `Direction.North`, `Direction.East` and so on. They pass straight into C++, and a member that comes back is the same object, so `===` compares them.' },
            { type: 'p', text: 'Only public members bind; whatever is private stays inside C++.' },
            tryIt('Add `Direction turnLeft(Direction direction);` and walk the square the other way round.'),
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
            tryIt('Add a `Triangle` with a base and a height, and describe one from `main.js`.'),
        ],
    },
    {
        sample: 'callbacks',
        title: 'Callbacks',
        description: 'JavaScript functions passed to C++ through function pointers.',
        lede: 'A function pointer parameter takes a JavaScript function, and C++ calls it like any other.',
        blocks: [
            { type: 'p', text: '`countdown` calls its `Visitor` once for every number, and each call runs the arrow function from `main.js`. `applyTwice` uses what its `Transform` returns.' },
            { type: 'p', text: 'Each JavaScript function handed to C++ holds a slot in the module until `m.releaseCallback(fn)` frees it, so release a function once C++ no longer needs it.' },
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
            { type: 'h2', id: 'next', text: 'Where to go next' },
            {
                type: 'ul',
                items: [
                    `[Quick start](${guideHref('quick-start')}): crossbind in a project of your own.`,
                    `[Libraries](${LIBRARIES_URL}): ready-made C and C++ libraries, from SQLite to GDAL.`,
                    `[Rust](${guideHref('rust')}) and [crates.io](${guideHref('crates-io')}): Rust files and crates import the same way.`,
                    `[Runtime API](${guideHref('runtime-api')}), [Configuration](${guideHref('configuration')}) and [CLI](${guideHref('cli')}): \`initNative()\`, \`crossbind.config.js\` and the command line.`,
                    `[Playground](${PLAYGROUND_URL}): every sample, free to change.`,
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
