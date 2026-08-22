import { useEffect, useRef, useState } from 'react';
import { searchGuide } from './search.js';

// ⌘K search over the guide. Native <dialog> for the focus trap and Escape handling, same as
// PromptModal; the arrow keys and Enter are ours because a list of results is not a form control.
export default function Search({
    tokens, open, onOpen, onClose,
}) {
    const ref = useRef(null);
    const [query, setQuery] = useState('');
    const [cursor, setCursor] = useState(0);
    const results = searchGuide(query);

    useEffect(() => {
        const onShortcut = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key?.toLowerCase() === 'k') {
                event.preventDefault();
                if (open) onClose();
                else onOpen();
            }
        };
        window.addEventListener('keydown', onShortcut);
        return () => window.removeEventListener('keydown', onShortcut);
    }, [open, onOpen, onClose]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (open && !el.open) el.showModal();
        if (!open && el.open) el.close();
        // A fresh query every time it opens; a stale one hides the "type to search" affordance.
        if (!open) {
            setQuery('');
            setCursor(0);
        }
    }, [open]);

    const move = (step) => {
        if (results.length === 0) return;
        setCursor((current) => (current + step + results.length) % results.length);
    };

    const onKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            move(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            move(-1);
        } else if (event.key === 'Enter' && results[cursor]) {
            event.preventDefault();
            window.location.href = results[cursor].href;
        }
    };

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            onClick={(event) => { if (event.target === ref.current) onClose(); }}
            onKeyDown={onKeyDown}
            aria-label="Search the guide"
            className="prompt-dialog"
            style={{
                width: 'min(620px, calc(100vw - 32px))',
                padding: 0,
                border: `1px solid ${tokens.borderRaised}`,
                borderRadius: 16,
                background: tokens.panelRaised,
                boxShadow: tokens.raisedShadow,
                color: tokens.text,
                overflow: 'hidden',
                textAlign: 'left',
            }}
        >
            <input
                value={query}
                onInput={(event) => { setQuery(event.target.value); setCursor(0); }}
                placeholder="Search the guide…"
                aria-label="Search the guide"
                style={{
                    width: '100%',
                    padding: '18px 20px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${tokens.border}`,
                    color: tokens.text,
                    fontFamily: tokens.sans,
                    fontSize: 16,
                    outline: 'none',
                }}
            />

            <div role="listbox" aria-label="Results" style={{ maxHeight: 'min(52vh, 420px)', overflowY: 'auto' }}>
                {results.map((result, i) => (
                    <a
                        key={result.href}
                        href={result.href}
                        role="option"
                        aria-selected={i === cursor}
                        onMouseEnter={() => setCursor(i)}
                        style={{
                            display: 'block',
                            padding: '12px 20px 12px 18px',
                            borderBottom: `1px solid ${tokens.border}`,
                            // pillBg rather than a panel tone: the dialog already sits on the
                            // raised surface, so a flat panel colour reads as darker, not selected.
                            background: i === cursor ? tokens.pillBg : 'transparent',
                            borderLeft: `2px solid ${i === cursor ? tokens.accentText : 'transparent'}`,
                        }}
                    >
                        <div style={{ fontSize: 14, fontWeight: 600, color: tokens.text }}>{result.title}</div>
                        <div style={{ fontSize: 12.5, color: tokens.textMuted, marginTop: 2 }}>{result.sub}</div>
                    </a>
                ))}
                {results.length === 0 ? (
                    <div style={{ padding: '18px 20px', fontSize: 13.5, color: tokens.textMuted }}>
                        {query ? `No guide page matches “${query}”.` : 'Type to search every guide page and section.'}
                    </div>
                ) : null}
            </div>

            <div style={{
                display: 'flex',
                gap: 16,
                padding: '10px 20px',
                borderTop: `1px solid ${tokens.border}`,
                fontFamily: tokens.mono,
                fontSize: 11,
                color: tokens.textMuted,
            }}
            >
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>esc close</span>
            </div>
        </dialog>
    );
}
