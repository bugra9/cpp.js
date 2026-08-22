import { useEffect, useRef, useState } from 'react';
import { SETUP_PROMPT } from '../data.js';

// Native <dialog> so the focus trap, Escape handling and inertness come from the platform
// rather than from hand-rolled key listeners.
export default function PromptModal({ tokens, open, onClose }) {
    const ref = useRef(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (open && !el.open) el.showModal();
        if (!open && el.open) el.close();
    }, [open]);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(SETUP_PROMPT);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard is blocked outside a secure context; the text stays selectable.
        }
    };

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            // A backdrop click lands on the dialog element itself, not on its children.
            onClick={(e) => { if (e.target === ref.current) onClose(); }}
            aria-label="Setup prompt"
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
                    <span style={{ fontSize: 15, fontWeight: 600 }}>Setup prompt</span>
                    <span style={{ fontSize: 12.5, color: tokens.textDim }}>
                        Paste into Claude Code, Cursor, Copilot…
                    </span>
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

                <pre style={{
                    margin: 0,
                    padding: '18px 20px',
                    overflow: 'auto',
                    flex: 1,
                    background: tokens.codeBg,
                    color: tokens.codeText,
                    fontFamily: tokens.mono,
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                }}
                >
                    {SETUP_PROMPT}
                </pre>

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    padding: '14px 20px',
                    borderTop: `1px solid ${tokens.border}`,
                }}
                >
                    <button
                        type="button"
                        onClick={copy}
                        style={{
                            background: tokens.buttonBg,
                            color: tokens.buttonText,
                            border: 'none',
                            padding: '11px 20px',
                            borderRadius: 10,
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: 'pointer',
                        }}
                    >
                        <span aria-live="polite">{copied ? 'Copied ✓' : 'Copy prompt'}</span>
                    </button>
                </div>
            </div>
        </dialog>
    );
}
