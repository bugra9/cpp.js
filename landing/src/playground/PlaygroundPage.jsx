import { useEffect, useState } from 'react';
import { CodeWindow } from '../components/ui.jsx';
import { inline } from '../guide/inline.jsx';
import {
    editDraft, readDrafts, updateDrafts, without,
} from './drafts.js';
import Editor, { fitHeight } from './Editor.jsx';
import {
    Console, Notice, Toolbar, linkButtonStyle,
} from './parts.jsx';
import { DEFAULT_SAMPLE, SAMPLES, findSample } from './samples.js';
import { canRunPrebuilt, useRunner } from './useRunner.js';

// /playground/: a sample picker, three editors, a Run button and a console. useRunner.js runs main.js against the
// sample's prebuilt module, or against one the playground compiler (tooling/cloud) builds from edited C++. The first
// render matches the prerendered page: the drafts, the linked sample, the sign-in result and the session load
// afterwards.

const DRAFT_KEY = 'crossbind.playground.draft';
const SAMPLE_PARAM = 'sample';
const RESET_QUESTION = 'Discard your changes to this sample?';
const LOGIN_NOTICES = Object.freeze({
    ok: 'Signed in.',
    'too-new': 'This GitHub account is too new to sign in here yet.',
    blocked: 'This GitHub account may not use the playground.',
    failed: 'Signing in did not work; try again.',
    cancelled: 'Signing in was cancelled.',
});

// ?sample=<id> opens that sample, and the address follows the picker, so every sample can be linked to.
const linkedSample = () => findSample(new URLSearchParams(location.search).get(SAMPLE_PARAM))?.id;

function linkSample(id) {
    const url = new URL(location.href);
    url.searchParams.set(SAMPLE_PARAM, id);
    history.replaceState(null, '', url);
}

function takeLoginResult() {
    const result = new URLSearchParams(location.hash.slice(1)).get('login');
    if (!result) return null;
    history.replaceState(null, '', location.pathname + location.search);
    return LOGIN_NOTICES[result] ?? null;
}

function SamplePicker({
    tokens, sampleId, edited, disabled, onSelect, onReset,
}) {
    return (
        <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, fontSize: 13, color: tokens.textDim }}>
            <label htmlFor="playground-sample">Sample</label>
            <select
                id="playground-sample"
                value={sampleId}
                disabled={disabled}
                onChange={(event) => onSelect(event.target.value)}
                className="tap-target"
                style={{
                    padding: '9px 12px',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    color: tokens.text,
                    background: tokens.panel,
                    border: `1px solid ${tokens.borderStrong}`,
                    borderRadius: 8,
                    cursor: disabled ? 'default' : 'pointer',
                }}
            >
                {SAMPLES.map((sample) => (
                    <option key={sample.id} value={sample.id}>{sample.title}</option>
                ))}
            </select>
            {edited && (
                <button type="button" onClick={onReset} disabled={disabled} className="tap-target" style={linkButtonStyle(tokens)}>
                    Reset
                </button>
            )}
        </span>
    );
}

// Never shorter than these, and tall enough for the sample without a scrollbar; the editors still grow by their
// resize handle.
const EDITOR_HEIGHTS = Object.freeze({ 'native.h': 400, 'native.cpp': 400, 'main.js': 240 });

function EditorWindow({
    tokens, name, value, original, onChange,
}) {
    return (
        <CodeWindow tokens={tokens} title={name} padded={false}>
            <Editor tokens={tokens} label={name} value={value} onChange={onChange} minHeight={Math.max(EDITOR_HEIGHTS[name], fitHeight(original))} />
        </CodeWindow>
    );
}

export default function PlaygroundPage({ tokens, page }) {
    const [sampleId, setSampleId] = useState(DEFAULT_SAMPLE.id);
    const [drafts, setDrafts] = useState({});
    const [restored, setRestored] = useState(false);
    const runner = useRunner();
    const sample = findSample(sampleId);
    const sources = { ...sample.files, ...drafts[sampleId] };
    const prebuilt = canRunPrebuilt(sampleId, sources, sample.files);

    useEffect(() => {
        const stored = readDrafts(DRAFT_KEY, SAMPLES);
        const linked = linkedSample();
        const id = linked ?? stored.sample ?? DEFAULT_SAMPLE.id;
        setDrafts(stored.drafts);
        setSampleId(id);
        setRestored(true);
        // A sample restored from an earlier visit goes into the address too, so a copied link keeps it.
        if (!linked && id !== DEFAULT_SAMPLE.id) linkSample(id);
        const loginNotice = takeLoginResult();
        if (loginNotice) runner.setNotice({ text: loginNotice });
    }, []);

    const edit = (name) => (text) => {
        setDrafts((current) => editDraft(current, sample, name, text));
        updateDrafts(DRAFT_KEY, SAMPLES, (store) => ({ ...store, drafts: editDraft(store.drafts, sample, name, text) }));
    };
    const run = () => runner.run({ sampleId, sources, original: sample.files });

    function selectSample(id) {
        setSampleId(id);
        linkSample(id);
        updateDrafts(DRAFT_KEY, SAMPLES, (store) => ({ ...store, sample: id }));
        runner.clear();
    }

    function resetSample() {
        if (!window.confirm(RESET_QUESTION)) return;
        setDrafts((current) => without(current, sampleId));
        updateDrafts(DRAFT_KEY, SAMPLES, (store) => ({ ...store, drafts: without(store.drafts, sampleId) }));
        // The button goes with the draft, so focus moves to the picker beside it.
        document.getElementById('playground-sample')?.focus();
    }

    const onKeyDown = (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            run();
        }
    };

    // Keyed by the sample, so switching starts each editor at the top and at its own height.
    const editor = (name) => (
        <EditorWindow key={`${sampleId}/${name}`} tokens={tokens} name={name} value={sources[name]} original={sample.files[name]} onChange={edit(name)} />
    );

    return (
        <main id="content">
            <section style={{ padding: '52px var(--content-x) 24px' }}>
                <div style={{ maxWidth: 880 }}>
                    <h1 style={{ fontSize: 'clamp(36px, 5vw, 54px)', fontWeight: 600, letterSpacing: -2, lineHeight: 1.02, margin: '0 0 16px', color: tokens.text }}>
                        {page.title}
                    </h1>
                    <p style={{ fontSize: 17, lineHeight: 1.65, color: tokens.textDim, margin: 0 }}>{inline(page.lede, tokens)}</p>
                </div>
            </section>

            <section style={{ padding: '0 var(--content-x) 32px' }} onKeyDown={onKeyDown}>
                <Toolbar
                    tokens={tokens}
                    phase={runner.phase}
                    session={runner.session}
                    ready={restored && runner.phase === 'idle' && (prebuilt || runner.canCompile)}
                    prebuilt={prebuilt}
                    onRun={run}
                    onStop={runner.stop}
                    onSignOut={runner.leave}
                    onDeleteAccount={runner.removeAccount}
                >
                    <SamplePicker tokens={tokens} sampleId={sampleId} edited={Boolean(drafts[sampleId])} disabled={runner.phase !== 'idle'} onSelect={selectSample} onReset={resetSample} />
                </Toolbar>
                <div ref={runner.check} />
                {runner.notice && <Notice tokens={tokens} notice={runner.notice} canSignIn={Boolean(runner.session?.canSignIn)} />}
                <div className="playground-grid">
                    <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                        {editor('native.h')}
                        {editor('native.cpp')}
                    </div>
                    <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                        {editor('main.js')}
                        <Console tokens={tokens} lines={runner.lines} buildLog={runner.buildLog} />
                    </div>
                </div>
            </section>

            <section style={{ padding: '0 var(--content-x) 80px' }}>
                <div style={{ maxWidth: 880 }}>
                    {page.blocks.map((block) => (block.type === 'h2' ? (
                        <h2 key={block.id} id={block.id} style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, margin: '32px 0 10px', color: tokens.text }}>{block.text}</h2>
                    ) : (
                        <p key={block.text} style={{ fontSize: 15, lineHeight: 1.7, color: tokens.textDim, margin: 0 }}>{inline(block.text, tokens)}</p>
                    )))}
                </div>
            </section>
        </main>
    );
}
