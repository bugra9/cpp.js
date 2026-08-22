import { FEATURE_EXTRAS, FEATURE_GROUPS, FEATURES } from '../data.js';
import { guideHref } from '../guide/nav.js';

const GROUP_ACCENTS = {
    write: 'accent',
    resolve: 'blue',
    build: 'violet',
    run: 'accent',
    ship: 'blue',
    trust: 'warn',
};

function TagMark({ accent }) {
    return <span aria-hidden="true" style={{ color: accent, marginRight: 8 }}>■</span>;
}

function CapabilityMatrix({ tokens }) {
    return (
        <section
            className="feature-matrix"
            aria-labelledby="capability-matrix-title"
            style={{ background: tokens.panel, border: `1px dashed ${tokens.borderStrong}` }}
        >
            <header className="feature-matrix-header">
                <div>
                    <h2
                        id="capability-matrix-title"
                        className="feature-matrix-label"
                        style={{ fontFamily: tokens.mono, color: tokens.textMuted }}
                    >
                        FULL CAPABILITY MATRIX
                    </h2>
                    <strong className="feature-matrix-title" style={{ color: tokens.text }}>
                        {`${FEATURES.length} capabilities · ${FEATURE_EXTRAS.length} platform details`}
                    </strong>
                </div>
            </header>

            <div className="feature-matrix-grid">
                {FEATURE_GROUPS.map((group) => {
                    const accent = tokens[GROUP_ACCENTS[group.id]];
                    const items = FEATURES.filter((feature) => feature.group === group.id);

                    return (
                        <div key={group.id} className="feature-matrix-group">
                            <div className="feature-matrix-group-header">
                                <div>
                                    <h3 className="feature-matrix-group-title" style={{ color: tokens.text }}>
                                        <TagMark accent={accent} />
                                        {group.label}
                                    </h3>
                                    <p className="feature-matrix-group-hint" style={{ color: tokens.textMuted }}>
                                        {group.hint}
                                    </p>
                                </div>
                                <span className="feature-matrix-group-count" style={{ fontFamily: tokens.mono, color: accent }}>
                                    {String(items.length).padStart(2, '0')}
                                </span>
                            </div>
                            <div className="feature-matrix-list">
                                {items.map((feature) => (
                                    <a
                                        key={feature.id}
                                        className="feature-matrix-item"
                                        href={guideHref(feature.guide)}
                                        style={{ borderColor: tokens.border }}
                                    >
                                        <span className="feature-matrix-item-heading">
                                            <span style={{ fontFamily: tokens.mono, color: accent }}>{feature.num}</span>
                                            <strong style={{ color: tokens.text }}>{feature.title}</strong>
                                            <span aria-hidden="true" style={{ color: accent }}>→</span>
                                        </span>
                                        <span className="feature-matrix-copy" style={{ color: tokens.textDim }}>
                                            {feature.summary}
                                        </span>
                                        <span className="feature-matrix-tags" style={{ fontFamily: tokens.mono, color: tokens.textMuted }}>
                                            {feature.tag.join(' · ')}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="feature-matrix-extras" style={{ borderColor: tokens.border }}>
                <h3 style={{ color: tokens.text }}>Platform & tooling details</h3>
                <ul>
                    {FEATURE_EXTRAS.map((extra) => (
                        <li key={extra} style={{ color: tokens.textDim }}>
                            <TagMark accent={tokens.accent} />
                            {extra}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export default function Features({ tokens }) {
    return (
        <section className="feature-section">
            <CapabilityMatrix tokens={tokens} />

            <div className="feature-footer" style={{ borderColor: tokens.border }}>
                <p style={{ color: tokens.textMuted }}>
                    Platform caveats stay explicit: Rust targets, browser threads and Android linking are documented per capability.
                </p>
                <a className="feature-all-link tap-target" href={guideHref()} style={{ color: tokens.text }}>
                    Browse the complete guide
                    <span style={{ color: tokens.accent }} aria-hidden="true">→</span>
                </a>
            </div>
        </section>
    );
}
