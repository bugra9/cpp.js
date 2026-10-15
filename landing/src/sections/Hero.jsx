import { useState } from 'react';
import CommandChip from '../components/CommandChip.jsx';
import PlatformScene from '../components/PlatformScene.jsx';
import PromptModal from '../components/PromptModal.jsx';
import Tabs from '../components/Tabs.jsx';
import {
    CodeWindow, highlight, primaryButtonStyle, secondaryButtonStyle,
} from '../components/ui.jsx';
import { CREATE_COMMANDS, HERO_FILES, RUNTIMES } from '../data.js';
import { guideHref } from '../guide/nav.js';

// The band under the hero; the detail of each target is its tooltip.
function RunsOn({ tokens }) {
    return (
        <ul className="runs-on-list" style={{ marginTop: 56 }}>
            {RUNTIMES.map((runtime) => (
                <li key={runtime.id} className="runs-on-item" title={runtime.detail}>
                    <span style={{ display: 'flex', color: tokens.textMuted, marginBottom: 8 }}>
                        <PlatformScene id={runtime.scene} />
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: tokens.text }}>{runtime.title}</span>
                    <span style={{ maxWidth: 190, fontSize: 13, color: tokens.textMuted, textAlign: 'center', textWrap: 'balance' }}>
                        {runtime.names}
                    </span>
                </li>
            ))}
        </ul>
    );
}

function CreateCommand({ tokens }) {
    const [active, setActive] = useState(CREATE_COMMANDS[0].id);
    const { command } = CREATE_COMMANDS.find((entry) => entry.id === active);

    return (
        <>
            <Tabs tokens={tokens} label="Package manager" tabs={CREATE_COMMANDS} panelId="create-panel" active={active} onSelect={setActive} />
            <div role="tabpanel" id="create-panel" aria-labelledby={`create-panel-${active}`} style={{ maxWidth: 560 }}>
                <CommandChip tokens={tokens} command={command} />
            </div>
        </>
    );
}

// The headline claims C++ and Rust, so the proof sits right beside it: main.js imports both. Every
// file stays in one grid cell, so switching tabs keeps the window at the tallest file's height.
function UniversalCode({ tokens }) {
    const [active, setActive] = useState(HERO_FILES[0].id);

    return (
        <CodeWindow
            tokens={tokens}
            title={<Tabs tokens={tokens} label="Files" tabs={HERO_FILES} panelId="hero-file" active={active} onSelect={setActive} style={{ marginBottom: 0, flexWrap: 'wrap' }} />}
        >
            <div role="tabpanel" id="hero-file" aria-labelledby={`hero-file-${active}`} style={{ display: 'grid', whiteSpace: 'pre' }}>
                {HERO_FILES.map((file) => (
                    <div key={file.id} style={{ gridArea: '1 / 1', visibility: file.id === active ? 'visible' : 'hidden' }}>
                        {highlight(file.code, tokens)}
                    </div>
                ))}
            </div>
        </CodeWindow>
    );
}

// The docs path is the primary call; the agent prompt stays one click away as the secondary.
function AgentSetup({ tokens, onOpen }) {
    return (
        <button
            type="button"
            className="tap-target"
            onClick={onOpen}
            aria-haspopup="dialog"
            style={{ ...secondaryButtonStyle(tokens), cursor: 'pointer' }}
        >
            Set up with an AI agent
        </button>
    );
}

export default function Hero({ tokens }) {
    const [promptOpen, setPromptOpen] = useState(false);

    return (
        <section className="hero" style={{ padding: '56px var(--content-x) 48px' }}>
            <div className="hero-grid">
                <div>
                    <h1 style={{
                        fontFamily: tokens.sans,
                        fontSize: 'var(--hero-title)',
                        fontWeight: 600,
                        lineHeight: 1.04,
                        letterSpacing: '-0.04em',
                        margin: '0 0 64px',
                    }}
                    >
                        Import C++ and Rust
                        <br />
                        <span style={{ color: tokens.accentDisplay }}>like JavaScript modules.</span>
                    </h1>

                    <CreateCommand tokens={tokens} />

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '52px 0 18px' }}>
                        <a className="tap-target" href={guideHref('quick-start')} style={primaryButtonStyle(tokens)}>
                            Get started
                        </a>
                        <AgentSetup tokens={tokens} onOpen={() => setPromptOpen(true)} />
                    </div>

                    <p style={{ margin: 0, fontSize: 13.5, color: tokens.textMuted }}>
                        Free and open source under the MIT license.
                    </p>
                </div>

                <div style={{ minWidth: 0 }}>
                    <UniversalCode tokens={tokens} />
                </div>
            </div>

            <RunsOn tokens={tokens} />

            <PromptModal tokens={tokens} open={promptOpen} onClose={() => setPromptOpen(false)} />
        </section>
    );
}
