import { useEffect, useRef, useState } from 'react';
import { PACKAGES } from '../../../tooling/cloud/compiler/packages.js';
import { MAX_PACKAGES } from '../../../tooling/cloud/compiler/validate.js';
import Tabs from '../components/Tabs.jsx';
import { highlight } from '../components/ui.jsx';
import { PORTS } from '../ports/catalog.js';
import { SOURCE_LABELS } from './ProjectPanel.jsx';
import { canAddPackage, usageOf } from './project.js';

// The packages a project may use (tooling/cloud/compiler/packages.js), by where they come from. Adding one that
// main.js imports writes its import into main.js; one the C++ includes shows the #include to copy. A package leaves
// the project from the side panel.

const SOURCES = Object.freeze([
    { id: 'port', label: 'crossbind ports' },
    { id: 'crate', label: 'crates.io' },
    { id: 'conan', label: 'ConanCenter' },
]);

const matches = (pkg, query) => `${pkg.name} ${pkg.summary}`.toLowerCase().includes(query.trim().toLowerCase());

// A port's own version is its library's (the Libraries catalog), not its npm package's.
const versionOf = (pkg) => (pkg.source === 'port' ? PORTS.find(({ family }) => family === pkg.name)?.nativeVersion : null) ?? pkg.version;

function modernLook(tokens) {
    return {
        code: tokens,
        dialog: {
            border: `1px solid ${tokens.borderRaised}`, borderRadius: 14, background: tokens.panelRaised, boxShadow: tokens.raisedShadow, color: tokens.text, fontFamily: tokens.sans,
        },
        input: {
            color: tokens.text, background: tokens.panel, border: `1px solid ${tokens.borderStrong}`, borderRadius: 8,
        },
        list: { borderTop: `1px solid ${tokens.border}` },
        row: (added) => ({ borderBottom: `1px solid ${tokens.border}`, background: added ? tokens.pillBg : 'transparent' }),
        dim: tokens.textDim,
        muted: tokens.textMuted,
        link: tokens.accentText,
        tab: undefined,
        tabLabel: (label, count) => `${label} ${count}`,
        add: (added) => ({
            label: added ? 'Added' : 'Add', style: { borderRadius: 7, border: `1px solid ${tokens.borderStrong}`, color: added ? tokens.accentText : tokens.text },
        }),
        usage: {
            background: tokens.codeBg, border: `1px solid ${tokens.border}`, borderRadius: 8, color: tokens.codeText,
        },
    };
}

function Usage({ look, pkg }) {
    const [copied, setCopied] = useState(false);
    const { inMain, line } = usageOf(pkg);
    const copy = () => navigator.clipboard?.writeText(line).then(() => setCopied(true), () => undefined);
    return (
        <div style={{ padding: '14px 20px 18px' }}>
            <div style={{
                display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, color: look.muted, marginBottom: 6,
            }}
            >
                <span>{inMain ? `Goes into main.js when you add ${pkg.name}` : 'Goes into your C++ under native/'}</span>
                <button type="button" onClick={copy} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: look.link, cursor: 'pointer' }}>
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div style={{
                fontFamily: look.code.mono, fontSize: 12.5, padding: '9px 12px', whiteSpace: 'pre', overflowX: 'auto', ...look.usage,
            }}
            >
                {highlight(line, look.code)}
            </div>
        </div>
    );
}

export default function PackageDialog({
    tokens, open, project, onAdd, onClose,
}) {
    const ref = useRef(null);
    const [query, setQuery] = useState('');
    const [source, setSource] = useState(SOURCES[0].id);
    const [chosen, setChosen] = useState(null);
    const look = modernLook(tokens);

    // Native <dialog>, so the focus trap, Escape and inertness come from the platform, as PromptModal does.
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (open && !el.open) el.showModal();
        if (!open && el.open) el.close();
    }, [open]);

    const found = PACKAGES.filter((pkg) => matches(pkg, query));
    const shown = found.filter((pkg) => pkg.source === source);
    const focused = shown.find((pkg) => pkg.id === chosen) ?? shown[0];
    const full = !canAddPackage(project);
    const tabs = SOURCES.map(({ id, label }) => ({ id, label: look.tabLabel(label, found.filter((pkg) => pkg.source === id).length, id === source) }));

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            onClick={(event) => {
                if (event.target === ref.current) onClose();
            }}
            aria-labelledby="package-dialog-title"
            className="prompt-dialog"
            style={{
                width: 'min(600px, calc(100vw - 32px))', maxHeight: 'min(80vh, 680px)', padding: 0, overflow: 'hidden', ...look.dialog,
            }}
        >
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '18px 20px 12px' }}>
                    <h2 id="package-dialog-title" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                        Add a package
                    </h2>
                    <span style={{ flex: 1 }} />
                    <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', padding: 4, fontSize: 18, color: look.dim, cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ padding: '0 20px' }}>
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search"
                        aria-label="Search packages"
                        spellcheck={false}
                        style={{
                            width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontFamily: tokens.mono, fontSize: 13, ...look.input,
                        }}
                    />
                </div>
                <Tabs tokens={tokens} label="Where packages come from" tabs={tabs} panelId="package-list" active={source} onSelect={setSource} tabStyle={look.tab} style={{ padding: '12px 20px 8px', margin: 0, flexWrap: 'wrap' }} />
                <ul
                    role="tabpanel"
                    id="package-list"
                    aria-labelledby={`package-list-${source}`}
                    style={{
                        listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto', flex: 1, minHeight: 0, ...look.list,
                    }}
                >
                    {shown.map((pkg) => {
                        const added = project.packages.includes(pkg.id);
                        const add = look.add(added);
                        return (
                            <li
                                key={pkg.id}
                                onFocus={() => setChosen(pkg.id)}
                                onMouseEnter={() => setChosen(pkg.id)}
                                style={{
                                    display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr) auto', gap: 12, alignItems: 'center', padding: '9px 20px', ...look.row(added),
                                }}
                            >
                                <span style={{ fontFamily: tokens.mono, fontSize: 13, fontWeight: 600 }}>{pkg.name}</span>
                                <span style={{ fontSize: 13, color: look.dim }}>
                                    {pkg.summary}
                                    <span style={{ color: look.muted, fontSize: 12 }}>{` · ${versionOf(pkg)}`}</span>
                                </span>
                                {added ? (
                                    <span style={{
                                        fontSize: 12.5, padding: '4px 12px', ...add.style, border: 'none',
                                    }}
                                    >
                                        {add.label}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        aria-label={`Add ${pkg.name}`}
                                        disabled={full}
                                        onClick={() => {
                                            setChosen(pkg.id);
                                            onAdd(pkg.id);
                                        }}
                                        className="tap-target"
                                        style={{
                                            fontSize: 12.5, fontFamily: 'inherit', padding: '4px 12px', background: 'transparent', cursor: full ? 'default' : 'pointer', opacity: full ? 0.55 : 1, ...add.style,
                                        }}
                                    >
                                        {add.label}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                    {shown.length === 0 && <li style={{ padding: '14px 20px', fontSize: 13, color: look.muted }}>{`No ${SOURCE_LABELS[source]} package matches.`}</li>}
                </ul>
                {full && <p style={{ margin: 0, padding: '10px 20px 0', fontSize: 12.5, color: look.muted }}>{`A project uses ${MAX_PACKAGES} packages at most.`}</p>}
                {focused && <Usage key={focused.id} look={look} pkg={focused} />}
            </div>
        </dialog>
    );
}
