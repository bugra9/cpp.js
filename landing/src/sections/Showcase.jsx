import { LIBRARIES_URL, SHOWCASE, SHOWCASE_COUNT } from '../data.js';

export default function Showcase({ tokens }) {
    return (
        <section style={{ padding: '40px var(--content-x) 80px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px 16px', marginBottom: 24 }}>
                <h2 style={{ fontSize: 36, margin: 0, fontWeight: 600, letterSpacing: -1, color: tokens.text }}>
                    Drop in prebuilt C and C++ libraries.
                </h2>
                <a href={LIBRARIES_URL} className="tap-target" style={{ color: tokens.accentText, fontSize: 14 }}>
                    {`All ${SHOWCASE_COUNT} libraries →`}
                </a>
            </div>

            <ul className="showcase-grid" style={{ '--rule': tokens.border, '--rule-hover': tokens.accent }}>
                {SHOWCASE.map((item) => (
                    <li key={item.name}>
                        <a href={item.href} className="showcase-item">
                            <span style={{ fontSize: 15, fontWeight: 600, color: tokens.text }}>{item.name}</span>
                            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: tokens.textDim }}>{item.desc}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
}
