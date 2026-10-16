import { useEffect, useRef } from 'react';
import { AGENT_PROMPT_PATH, SETUP_LINE } from '../data.js';
import CommandChip from './CommandChip.jsx';

// Native <dialog> so the focus trap, Escape handling and inertness come from the platform
// rather than from hand-rolled key listeners. One line to paste: the instructions it points at do
// the rest, the skill first and the integration after it.
export default function PromptModal({ tokens, open, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (open && !el.open) el.showModal();
        if (!open && el.open) el.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            // A backdrop click lands on the dialog element itself, not on its children.
            onClick={(e) => { if (e.target === ref.current) onClose(); }}
            aria-label="Agent setup"
            className="prompt-dialog"
            style={{
                width: 'min(760px, calc(100vw - 32px))',
                maxHeight: 'min(80vh, 720px)',
                padding: 0,
                border: `1px solid ${tokens.borderRaised}`,
                borderRadius: 16,
                background: tokens.panelRaised,
                boxShadow: tokens.raisedShadow,
                color: tokens.text,
                overflow: 'hidden',
                // The hero centres its text; a prompt has to read left-aligned.
                textAlign: 'left',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 'inherit' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '16px 20px',
                    borderBottom: `1px solid ${tokens.border}`,
                }}
                >
                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Agent setup</h2>
                    <div style={{ flex: 1 }} />
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: tokens.textDim,
                            fontSize: 18,
                            lineHeight: 1,
                            cursor: 'pointer',
                            padding: 4,
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* minHeight:0 lets this flex child scroll instead of stretching the dialog past its cap. */}
                <div style={{ overflow: 'auto', minHeight: 0, padding: 20 }}>
                    <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.55, color: tokens.textDim }}>
                        Paste this into Claude Code, Codex, Cursor, Copilot or any coding agent:
                    </p>
                    <CommandChip tokens={tokens} command={SETUP_LINE} />
                    <p style={{ margin: '12px 0 0', fontSize: 12.5, lineHeight: 1.55, color: tokens.textMuted }}>
                        It installs the crossbind skill, adds crossbind to the project and checks one call from JavaScript.
                        {' '}
                        <a href={AGENT_PROMPT_PATH} style={{ color: tokens.accentText }}>Read the instructions</a>
                    </p>
                </div>
            </div>
        </dialog>
    );
}
