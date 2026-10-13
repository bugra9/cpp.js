import { useEffect, useRef } from 'react';
import { Chevron } from './menu.jsx';

// A section that opens in place: a <details> whose summary is the heading, so it opens without
// JavaScript. A link to the heading's id opens the section it names.
export default function Disclosure({ tokens, id, title, open = false, children }) {
    const root = useRef(null);
    useEffect(() => {
        if (!id || !root.current || location.hash !== `#${id}`) return;
        root.current.open = true;
        // Opened, the page may be long enough to bring the heading up where the link meant it to be.
        document.getElementById(id)?.scrollIntoView();
    }, [id]);
    return (
        <details ref={root} className="disclosure" open={open} style={{ borderTop: `1px solid ${tokens.border}` }}>
            <summary
                className="tap-target"
                style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 0', cursor: 'pointer', listStyle: 'none', color: tokens.text }}
            >
                <h3 id={id} style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2, margin: 0, scrollMarginTop: 90 }}>{title}</h3>
                <Chevron />
            </summary>
            <div style={{ paddingBottom: 26 }}>{children}</div>
        </details>
    );
}
