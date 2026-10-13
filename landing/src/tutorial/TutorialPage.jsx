import { useEffect, useRef, useState } from 'react';
import PrevNext from '../components/PrevNext.jsx';
import Tabs from '../components/Tabs.jsx';
import { CodeWindow } from '../components/ui.jsx';
import Article from '../guide/Article.jsx';
import { inline } from '../guide/inline.jsx';
import { TUTORIAL_PAGES } from '../pages/tutorial.js';
import {
    editDraft, readDrafts, updateDrafts, without,
} from '../playground/drafts.js';
import Editor, { fitHeight } from '../playground/Editor.jsx';
import {
    Console, Notice, Toolbar, linkButtonStyle,
} from '../playground/parts.jsx';
import { SAMPLES, findSample } from '../playground/samples.js';
import { canRunPrebuilt, useRunner } from '../playground/useRunner.js';

// /tutorial/: one step per page, the lesson beside the step's playground sample in one tabbed editor, the run
// controls and the console. Edits are kept per step in this browser; useRunner.js runs an unedited step's prebuilt
// module, so reading through the tutorial never needs a compile.

const DRAFT_KEY = 'crossbind.tutorial.draft';
const RESET_QUESTION = 'Discard your changes to this step?';
const FILES = Object.freeze([
    { id: 'native.h', label: 'native.h' },
    { id: 'native.cpp', label: 'native.cpp' },
    { id: 'main.js', label: 'main.js' },
]);
const MIN_EDITOR_HEIGHT = 320;

export default function TutorialPage({ tokens, page }) {
    const sample = findSample(page.sample);
    const [file, setFile] = useState(FILES[0].id);
    const [drafts, setDrafts] = useState({});
    const [restored, setRestored] = useState(false);
    const runner = useRunner({ lazy: true });
    const output = useRef(null);
    const sources = { ...sample.files, ...drafts[sample.id] };
    const prebuilt = canRunPrebuilt(sample.id, sources, sample.files);
    const index = TUTORIAL_PAGES.findIndex((step) => step.path === page.path);
    // As tall as the sample's longest file, so switching files never moves the console.
    const editorHeight = Math.max(MIN_EDITOR_HEIGHT, ...FILES.map(({ id }) => fitHeight(sample.files[id])));

    useEffect(() => {
        setDrafts(readDrafts(DRAFT_KEY, SAMPLES).drafts);
        setRestored(true);
    }, []);

    // An unedited step runs its prebuilt module, so the session loads only once the C++ needs a compile.
    useEffect(() => {
        if (restored && !prebuilt) runner.connect();
    }, [restored, prebuilt]);

    const edit = (text) => {
        setDrafts((current) => editDraft(current, sample, file, text));
        updateDrafts(DRAFT_KEY, SAMPLES, (store) => ({ ...store, drafts: editDraft(store.drafts, sample, file, text) }));
    };
    // A long sample pushes the console below the fold, so a run brings it into view.
    const run = () => {
        output.current?.scrollIntoView({ block: 'nearest' });
        runner.run({ sampleId: sample.id, sources, original: sample.files });
    };

    function reset() {
        if (!window.confirm(RESET_QUESTION)) return;
        setDrafts((current) => without(current, sample.id));
        updateDrafts(DRAFT_KEY, SAMPLES, (store) => ({ ...store, drafts: without(store.drafts, sample.id) }));
        // The button goes with the draft, so focus moves to the open file's tab.
        document.getElementById(`tutorial-file-${file}`)?.focus();
    }

    const onKeyDown = (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            run();
        }
    };

    return (
        <main id="content" className="tutorial-grid" style={{ padding: '48px var(--content-x) 80px' }}>
            <article style={{ minWidth: 0 }}>
                <div style={{ fontFamily: tokens.mono, fontSize: 11, letterSpacing: 1.2, color: tokens.textMuted, marginBottom: 14 }}>
                    {`TUTORIAL · STEP ${index + 1} OF ${TUTORIAL_PAGES.length}`}
                </div>
                <h1 style={{ fontSize: 'clamp(30px, 3.4vw, 42px)', fontWeight: 600, letterSpacing: -1.2, lineHeight: 1.08, margin: '0 0 16px', color: tokens.text }}>
                    {page.title}
                </h1>
                <p style={{ fontSize: 16.5, lineHeight: 1.65, color: tokens.textDim, margin: '0 0 24px' }}>{inline(page.lede, tokens)}</p>
                <Article tokens={tokens} blocks={page.blocks} />
                <PrevNext tokens={tokens} label="Tutorial steps" prev={TUTORIAL_PAGES[index - 1]} next={TUTORIAL_PAGES[index + 1]} />
            </article>

            <section aria-label="Code" onKeyDown={onKeyDown} style={{ minWidth: 0 }}>
                <div style={{ marginBottom: 16 }}>
                    <CodeWindow
                        tokens={tokens}
                        padded={false}
                        title={<Tabs tokens={tokens} label="Files" tabs={FILES} panelId="tutorial-file" active={file} onSelect={setFile} style={{ marginBottom: 0 }} />}
                    >
                        <div role="tabpanel" id="tutorial-file" aria-labelledby={`tutorial-file-${file}`}>
                            <Editor key={`${sample.id}/${file}`} tokens={tokens} label={file} value={sources[file]} onChange={edit} minHeight={editorHeight} />
                        </div>
                    </CodeWindow>
                </div>
                <Toolbar
                    tokens={tokens}
                    phase={runner.phase}
                    session={runner.session}
                    ready={restored && runner.phase === 'idle' && (prebuilt || runner.canCompile)}
                    prebuilt={prebuilt}
                    away
                    onRun={run}
                    onStop={runner.stop}
                    onSignOut={runner.leave}
                    onDeleteAccount={runner.removeAccount}
                >
                    {drafts[sample.id] && (
                        <button type="button" onClick={reset} disabled={runner.phase !== 'idle'} className="tap-target" style={{ ...linkButtonStyle(tokens), fontSize: 13 }}>
                            Reset
                        </button>
                    )}
                </Toolbar>
                <div ref={runner.check} />
                {runner.notice && <Notice tokens={tokens} notice={runner.notice} canSignIn={Boolean(runner.session?.canSignIn)} away />}
                <div ref={output}>
                    <Console tokens={tokens} lines={runner.lines} buildLog={runner.buildLog} />
                </div>
            </section>
        </main>
    );
}
