import { useState } from 'react';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH, previewOf } from '../apps/appList.js';
import CommandChip from '../components/CommandChip.jsx';
import Tabs from '../components/Tabs.jsx';
import { DEMOS } from '../demos.js';
import { APP_GROUPS, DEFAULT_TEMPLATE, TEMPLATE_GROUPS } from './examples.js';

// /examples/ (pages/examples.js): the command for each create-crossbind template first, then every library app as
// a card with a picture of what it shows, which links to the app on its library's page.

const groupOf = (key) => TEMPLATE_GROUPS.find((group) => group.templates.some((template) => template.key === key));

function StartProject({ tokens }) {
    const [chosen, setChosen] = useState(DEFAULT_TEMPLATE);
    const group = groupOf(chosen);
    const template = group.templates.find((entry) => entry.key === chosen);
    const demo = DEMOS.get(template.key);
    const link = { fontSize: 14, color: tokens.accentText, textDecoration: 'none', whiteSpace: 'nowrap' };
    const pick = (id) => setChosen(TEMPLATE_GROUPS.find((entry) => entry.id === id).templates[0].key);

    return (
        <section aria-labelledby="start" style={{ border: `1px solid ${tokens.border}`, borderRadius: 14, background: tokens.panel, padding: '18px 20px', margin: '0 0 28px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 18px', marginBottom: 12 }}>
                <h2 id="start" style={{ fontSize: 17, fontWeight: 600, margin: 0, color: tokens.text, scrollMarginTop: 90 }}>Start a project</h2>
                <Tabs tokens={tokens} label="Platform" tabs={TEMPLATE_GROUPS} panelId="start-panel" active={group.id} onSelect={pick} style={{ marginBottom: 0, flexWrap: 'wrap' }} />
            </div>
            <div role="tabpanel" id="start-panel" aria-labelledby={`start-panel-${group.id}`}>
                {group.templates.length > 1 && (
                    <div role="group" aria-label="Template" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {group.templates.map((entry) => {
                            const selected = entry.key === chosen;
                            return (
                                <button
                                    key={entry.key}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => setChosen(entry.key)}
                                    className="tap-target"
                                    style={{
                                        fontFamily: tokens.mono,
                                        fontSize: 12.5,
                                        padding: '5px 11px',
                                        borderRadius: 999,
                                        cursor: 'pointer',
                                        background: 'transparent',
                                        border: `1px solid ${selected ? tokens.text : tokens.border}`,
                                        color: selected ? tokens.text : tokens.textDim,
                                    }}
                                >
                                    {entry.label}
                                </button>
                            );
                        })}
                    </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px' }}>
                    <div style={{ flex: '1 1 420px', minWidth: 0 }}>
                        <CommandChip tokens={tokens} command={template.command} />
                    </div>
                    <a href={template.source} className="tap-target" style={link}>Source on GitHub →</a>
                    {demo && <a href={demo.href} className="tap-target" style={link}>See it run →</a>}
                </div>
            </div>
        </section>
    );
}

// The picture matches the theme; a site built without the captured pictures leaves the frame empty rather than
// showing a broken image.
function AppTile({ tokens, app }) {
    return (
        <a href={app.href} className="example-card">
            <span className="example-card-picture" style={{ background: tokens.codeBg }}>
                <img
                    src={previewOf(app.id, tokens.isLight ? 'light' : 'dark')}
                    alt=""
                    width={PREVIEW_WIDTH}
                    height={PREVIEW_HEIGHT}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden';
                    }}
                />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 18px 18px' }}>
                <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.01em', color: tokens.text }}>{app.title}</span>
                <span style={{ fontFamily: tokens.mono, fontSize: 12, color: tokens.textMuted }}>{app.library}</span>
            </span>
        </a>
    );
}

export default function ExamplesPage({ tokens, page }) {
    return (
        <main id="content" style={{ padding: '52px var(--content-x) 96px' }}>
            <h1 style={{ fontSize: 'clamp(34px, 4.6vw, 52px)', fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1.06, margin: '0 0 18px', color: tokens.text, maxWidth: 900 }}>
                {page.title}
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: tokens.textDim, maxWidth: 760, margin: '0 0 36px' }}>{page.lede}</p>

            <StartProject tokens={tokens} />

            <nav aria-label="App categories" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 14 }}>
                {APP_GROUPS.map((group) => (
                    <a key={group.id} href={`#${group.id}`} className="tap-target" style={{ gap: 6, color: tokens.accentText, textDecoration: 'none' }}>
                        {group.label}
                        <span style={{ color: tokens.textMuted }}>{group.apps.length}</span>
                    </a>
                ))}
            </nav>

            {APP_GROUPS.map((group) => (
                <section key={group.id} aria-labelledby={group.id}>
                    <h2 id={group.id} style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', margin: '44px 0 18px', color: tokens.text, scrollMarginTop: 90 }}>
                        {group.label}
                    </h2>
                    <div className="examples-grid" style={{ '--rule': tokens.border, '--lit': tokens.accent, '--card': tokens.panel }}>
                        {group.apps.map((app) => <AppTile key={app.id} tokens={tokens} app={app} />)}
                    </div>
                </section>
            ))}
        </main>
    );
}
