import { Fragment } from 'react';
import { inline } from '../guide/inline.jsx';
import { CATEGORY_LABELS, PORTS } from './catalog.js';
import { portHref } from './pages.js';

// /ports/ as its own page: one row per library, grouped by what it is for, with what a reader picks
// a library by. Everything else is on the library's own page.

const CATEGORY_ORDER = ['geo', 'image', 'database', 'crypto', 'network', 'text', 'compression'];

const GROUPS = [...new Set([...CATEGORY_ORDER, ...PORTS.map((port) => port.category)])]
    .map((category) => [category, PORTS.filter((port) => port.category === category)])
    .filter(([, ports]) => ports.length);

// An SPDX expression breaks only between its terms, never inside `GPL-2.0-or-later`.
const license = (expression) =>
    expression.split(' ').map((term, index) => (
        <Fragment key={index}>
            {index ? ' ' : ''}
            <span style={{ whiteSpace: 'nowrap' }}>{term}</span>
        </Fragment>
    ));

function LibraryRow({ tokens, port }) {
    return (
        <li style={{ borderTop: `1px solid ${tokens.border}` }}>
            <a href={portHref(port.family)} className="lib-row" style={{ color: tokens.textDim, fontSize: 14, lineHeight: 1.5 }}>
                <span className="lib-name" style={{ color: tokens.text, fontWeight: 600, fontSize: 15 }}>{port.name}</span>
                <span className="lib-summary">{port.summary}</span>
                <span className="lib-version" style={{ fontFamily: tokens.mono, fontSize: 12.5 }}>{port.nativeVersion}</span>
                <span className="lib-license" style={{ fontFamily: tokens.mono, fontSize: 12.5 }}>{license(port.license)}</span>
            </a>
        </li>
    );
}

export default function LibrariesPage({ tokens, page }) {
    return (
        <main id="content">
            <section style={{ padding: '52px var(--content-x) 80px' }}>
                <div style={{ maxWidth: 1040 }}>
                    <h1
                        style={{
                            fontSize: 'clamp(36px, 5vw, 54px)',
                            fontWeight: 600,
                            letterSpacing: -2,
                            lineHeight: 1.02,
                            margin: '0 0 16px',
                            color: tokens.text,
                        }}
                    >
                        {page.title}
                    </h1>
                    <p style={{ fontSize: 17, lineHeight: 1.65, color: tokens.textDim, margin: 0, maxWidth: 720 }}>{inline(page.lede, tokens)}</p>

                    {GROUPS.map(([category, ports], index) => (
                        <section key={category} aria-labelledby={`category-${category}`} style={{ marginTop: 44 }}>
                            <div className="lib-group-head" style={{ fontSize: 13, fontWeight: 600, color: tokens.textMuted, marginBottom: 10 }}>
                                <h2 id={`category-${category}`} style={{ fontSize: 'inherit', fontWeight: 'inherit', margin: 0 }}>
                                    {CATEGORY_LABELS[category] ?? category}
                                </h2>
                                {index === 0 ? (
                                    <>
                                        <span className="lib-version lib-label" aria-hidden="true">Version</span>
                                        <span className="lib-license lib-label" aria-hidden="true">License</span>
                                    </>
                                ) : null}
                            </div>
                            <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderBottom: `1px solid ${tokens.border}` }}>
                                {ports.map((port) => (
                                    <LibraryRow key={port.family} tokens={tokens} port={port} />
                                ))}
                            </ul>
                        </section>
                    ))}

                    {page.blocks.map((block) =>
                        block.type === 'p' ? (
                            <p key={block.text} style={{ fontSize: 14, lineHeight: 1.65, color: tokens.textDim, margin: '36px 0 0', maxWidth: 720 }}>
                                {inline(block.text, tokens)}
                            </p>
                        ) : null,
                    )}
                </div>
            </section>
        </main>
    );
}
