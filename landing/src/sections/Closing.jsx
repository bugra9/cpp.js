import PRIVACY_PAGE from '../pages/privacy.js';
import { LICENSE_URL } from '../data.js';

// Docs, Libraries, the changelog (version menu) and GitHub sit in the navbar on every page, so the
// footer keeps only what the navbar lacks.
const LINKS = [
    { label: 'MIT License', href: LICENSE_URL, external: true },
    { label: 'Privacy', href: PRIVACY_PAGE.href },
];

export default function Closing({ tokens }) {
    return (
        <footer style={{
            padding: '40px var(--content-x)',
            borderTop: `1px solid ${tokens.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            color: tokens.textMuted,
            fontSize: 12,
        }}
        >
            <span>
                {/* Keeps the name with the year; the line breaks at "and" instead. */}
                <span style={{ whiteSpace: 'nowrap' }}>© 2026 Buğra Sarı</span>
                {' and crossbind contributors'}
            </span>
            <nav aria-label="Footer" style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                {LINKS.map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        className="tap-target"
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noreferrer' : undefined}
                        style={{ color: tokens.textDim }}
                    >
                        {link.label}
                    </a>
                ))}
            </nav>
        </footer>
    );
}
