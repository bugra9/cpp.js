import { useState } from 'react';

// One command or line with a copy button: the install line on a library page, the create line on
// an example, the line an agent is given. Sized to sit in a row with links, not a full code block.
// `primary` is for a chip whose copy is the main action where it stands, like the Agent setup window's:
// the copy segment then takes the main buttons' colors instead of reading as a label.
export default function CommandChip({ tokens, command, label = 'Copy', primary = false }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(command);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard is blocked outside a secure context; the text stays selectable.
        }
    };

    const look = primary
        ? { background: tokens.buttonBg, color: tokens.buttonText, fontFamily: tokens.sans, fontSize: 13.5, fontWeight: 600, padding: '0 18px' }
        : { background: tokens.codeSurface, color: tokens.textDim, fontFamily: tokens.mono, fontSize: 11, letterSpacing: 0.8, padding: '0 14px' };
    const [idle, done] = primary ? [label, 'Copied'] : [label.toUpperCase(), 'COPIED'];

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'stretch',
                width: '100%',
                border: `1px solid ${tokens.borderStrong}`,
                borderRadius: 10,
                background: tokens.codeBg,
                overflow: 'hidden',
            }}
        >
            <code
                style={{
                    padding: '10px 14px',
                    fontFamily: tokens.mono,
                    fontSize: 13,
                    color: tokens.codeText,
                    overflowWrap: 'anywhere',
                    alignSelf: 'center',
                    flex: 1,
                }}
            >
                {command}
            </code>
            <button
                type="button"
                onClick={copy}
                className="tap-target"
                aria-label={`Copy: ${command}`}
                style={{
                    border: 0,
                    borderLeft: `1px solid ${tokens.borderStrong}`,
                    cursor: 'pointer',
                    flexShrink: 0,
                    ...look,
                }}
            >
                {/* Both labels share one cell, so the button keeps the wider one's width and the line beside it never re-wraps. */}
                <span aria-live="polite" style={{ display: 'grid' }}>
                    <span style={{ gridArea: '1 / 1', visibility: copied ? 'hidden' : 'visible' }}>{idle}</span>
                    <span style={{ gridArea: '1 / 1', visibility: copied ? 'visible' : 'hidden' }}>{done}</span>
                </span>
            </button>
        </div>
    );
}
