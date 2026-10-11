import { useState } from 'react';
import CommandChip from '../components/CommandChip.jsx';
import PlatformScene from '../components/PlatformScene.jsx';
import PromptModal from '../components/PromptModal.jsx';
import {
    CodeWindow, highlight, primaryButtonStyle, secondaryButtonStyle,
} from '../components/ui.jsx';
import { CREATE_COMMANDS, RUNTIMES, UNIVERSAL_CODE } from '../data.js';
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

function Tabs({ tokens, label, tabs, panelId, active, onSelect }) {
    // Arrow keys are what a screen-reader user expects once this announces as a tablist.
    const onKeyDown = (event) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        const i = tabs.findIndex((t) => t.id === active);
        onSelect(tabs[(i + step + tabs.length) % tabs.length].id);
    };

    return (
        <div
            role="tablist"
            aria-label={label}
            onKeyDown={onKeyDown}
            style={{ display: 'flex', gap: 4, marginBottom: 10 }}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`tab-${tab.id}`}
                    className="tap-target"
                    aria-selected={tab.id === active}
                    aria-controls={panelId}
                    tabIndex={tab.id === active ? 0 : -1}
                    onClick={() => onSelect(tab.id)}
                    style={{
                        background: tab.id === active ? tokens.pillBg : 'transparent',
                        border: `1px solid ${tab.id === active ? tokens.borderStrong : 'transparent'}`,
                        color: tab.id === active ? tokens.text : tokens.textDim,
                        borderRadius: 8,
                        padding: '5px 14px',
                        fontSize: 12.5,
                        fontFamily: tokens.mono,
                        cursor: 'pointer',
                    }}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

function CreateCommand({ tokens }) {
    const [active, setActive] = useState(CREATE_COMMANDS[0].id);
    const { command } = CREATE_COMMANDS.find((entry) => entry.id === active);

    return (
        <>
            <Tabs tokens={tokens} label="Package manager" tabs={CREATE_COMMANDS} panelId="create-panel" active={active} onSelect={setActive} />
            <div role="tabpanel" id="create-panel" aria-labelledby={`tab-${active}`} style={{ maxWidth: 560 }}>
                <CommandChip tokens={tokens} command={command} />
            </div>
        </>
    );
}

// The headline claims C++ and Rust, so the proof sits right beside it: one file imports both.
function UniversalCode({ tokens }) {
    return (
        <CodeWindow tokens={tokens} title="src/main.js">
            {highlight(UNIVERSAL_CODE, tokens)}
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
