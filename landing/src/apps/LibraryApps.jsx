import { isLive, liveDemo, loadDemo } from '../live/runtime.js';
import { megabytes } from './AppCard.jsx';
import { LIBRARY_APPS } from './registry.jsx';

// The live section of /ports/<family>/. Every app of one library shares a single WebAssembly
// module built from landing/demos/<demo>, so the first run on the page downloads it and every
// other app reuses it. A library whose module was not built into the site shows no section.

export default function LibraryApps({ tokens, family, name }) {
    const entry = LIBRARY_APPS[family];
    if (!entry || !isLive(entry.demo)) return null;
    const demo = liveDemo(entry.demo);
    const load = () => loadDemo(entry.demo);
    return (
        <section id="apps" aria-label={`${name} apps`} style={{ paddingBottom: 8 }}>
            <h2
                style={{
                    fontSize: 23,
                    fontWeight: 600,
                    letterSpacing: -0.4,
                    margin: '46px 0 12px',
                    paddingTop: 18,
                    borderTop: `1px solid ${tokens.border}`,
                    color: tokens.text,
                }}
            >
                {entry.headline}
            </h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.75, color: tokens.textDim, margin: '0 0 22px' }}>
                {`${entry.lede} The first run downloads ${megabytes(demo.bytes ?? 0)} of WebAssembly once; every app on this page shares it, and nothing is uploaded.`}
            </p>
            <div style={{ display: 'grid', gap: 18 }}>
                {entry.apps.map((App, index) => <App key={App.appId} tokens={tokens} index={index} load={load} />)}
            </div>
        </section>
    );
}
