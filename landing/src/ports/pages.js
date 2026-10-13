import LIBRARY_EXAMPLES from '../../generated/library-examples.js';
import { guideHref } from '../guide/nav.js';
import { PORTS, publishedLibraryTargets, publishedTarget, TARGET_LABELS, WASI_TOOL_PORTS } from './catalog.js';
import { installTabs } from './platforms.js';

// /ports/ and /ports/<family>/. Every fact comes from the generated catalog and the checked usage
// examples; the prose here only frames them. Must stay importable from Node with no JSX.

export const PORTS_BASE = '/ports';
export const PORTS_INDEX_HREF = `${PORTS_BASE}/`;
export const portHref = (family) => `${PORTS_BASE}/${family}/`;

// The id the checked command-line program keeps on the page; the ports' READMEs link to it.
const PROGRAM_ID = 'wasi-program';

const examplesOf = (port) => LIBRARY_EXAMPLES[port.family] ?? null;

// The first header of the library a checked JavaScript only example imports, with one name it takes
// from it, so the install tabs show an import the site build has run.
function headerImportOf(library) {
    for (const example of library?.examples ?? []) {
        if (!example.direct || example.direct.impossible) continue;
        const match = example.direct.usage.match(/import\s*\{([^}]*)\}\s*from\s*'(@crossbind\/port-[^']+\.h)'/);
        const name = match?.[1].split(',').map((part) => part.trim().split(/\s+/)[0]).find((part) => part && part !== 'initNative');
        if (name) return { header: match[2], name };
    }
    return null;
}

function installBlocks(port) {
    const library = examplesOf(port);
    const tabs = installTabs(port, { programId: library?.wasi ? PROGRAM_ID : null, headerImport: headerImportOf(library) });
    if (!tabs.length || !port.published) return [];
    return [{ type: 'h2', id: 'install', text: 'Install' }, { type: 'tabs', tabs }];
}

// The checked examples, folded so their titles read as a list of tasks: the JavaScript ones, the
// setup their JavaScript only versions need, and last a whole C++ program built for WASI.
function examplesBlocks(port) {
    const library = examplesOf(port);
    if (!library) return [];
    const { direct, wasi: program } = library;
    return [
        { type: 'h2', id: 'examples', text: 'Examples' },
        {
            type: 'p',
            text: `Each one is a small C++ header and the JavaScript that calls it, with what it printed when the site was built.${direct ? ` The **JavaScript only** tab does the same with ${port.name}'s own headers and no C++ file.` : ''}${program ? ' The last is a whole C++ program, built for WASI.' : ''}`,
        },
        ...library.examples.map((example) => ({ type: 'example', demo: library.demo, example, runnable: true, direct, open: false })),
        ...(direct?.config?.length
            ? [
                  {
                      type: 'details',
                      summary: 'Setup for the JavaScript only examples',
                      blocks: [
                          { type: 'p', text: 'Imported straight from JavaScript, the headers need this configuration today; its comments say why.' },
                          ...direct.config.map(({ file, code }) => ({ type: 'code', file, code })),
                      ],
                  },
              ]
            : []),
        ...(program
            ? [
                  {
                      type: 'details',
                      id: PROGRAM_ID,
                      summary: program.title,
                      blocks: [
                          { type: 'p', text: program.summary },
                          { type: 'code', file: 'crossbind.config.js', code: program.config },
                          { type: 'code', file: program.sourceFile, code: program.source },
                          { type: 'code', file: 'shell', code: program.commands.join('\n') },
                          { type: 'code', file: 'output', code: program.expected.join('\n') },
                      ],
                  },
              ]
            : []),
    ];
}

function detailPage(port) {
    const targets = publishedLibraryTargets(port).map((target) => TARGET_LABELS[target.target]);
    return {
        kind: 'port',
        slug: port.family,
        title: port.name,
        description: `${port.summary}. Prebuilt for ${targets.length ? targets.join(', ') : 'no published target yet'}.`,
        lede: `${port.summary}.`,
        section: 'Libraries',
        path: `${PORTS_BASE}/${port.family}`,
        href: portHref(port.family),
        port,
        links: [
            { label: 'npm', href: `https://www.npmjs.com/package/${port.npm}` },
            { label: 'Port recipe', href: port.repositoryUrl },
            { label: 'Upstream source', href: port.upstreamSource },
        ],
        // `apps` marks where the page puts the live apps; nothing renders the block itself.
        blocks: [...installBlocks(port), { type: 'apps' }, ...examplesBlocks(port)],
    };
}

export const PORT_PAGES = PORTS.map(detailPage);

const librariesCount = PORTS.filter((port) => publishedLibraryTargets(port).length).length;

// The targets every library is published for, named the way the catalog's one-line summary reads.
const SHIPPED_FOR = [
    ['wasm', 'Web and Node.js'], ['android', 'Android'], ['ios', 'iOS'], ['darwin', 'macOS'],
    ['linux', 'Linux'], ['linuxmusl', 'Linux (musl)'], ['win32', 'Windows'], ['wasi', 'WASI'],
];
const shippedEverywhere = SHIPPED_FOR.filter(([target]) => PORTS.every((port) => publishedTarget(port, target))).map(([, label]) => label);
const listed = (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : items[0]);

export const PORTS_INDEX = {
    kind: 'ports-index',
    slug: '',
    title: 'Libraries',
    description: `${librariesCount} C and C++ libraries prebuilt for the web, Node.js, iOS, Android and WASI, plus the command-line tools of ${WASI_TOOL_PORTS.length} of them as npm executables.`,
    lede: `Prebuilt C and C++ libraries, each compiled from its pinned upstream source${shippedEverywhere.length ? ` and shipped for ${listed(shippedEverywhere)}` : ''}.`,
    section: 'Libraries',
    path: PORTS_BASE,
    href: PORTS_INDEX_HREF,
    eyebrow: { head: 'LIBRARIES', tail: '' },
    blocks: WASI_TOOL_PORTS.length
        ? [{ type: 'p', text: `${WASI_TOOL_PORTS.length} of them also ship their command-line tools as npm executables that run on wasmtime; see [WASI commands](${guideHref('wasi')}).` }]
        : [],
};

export const PORTS_ROUTES = [PORTS_INDEX.href, ...PORT_PAGES.map((page) => page.href)];
