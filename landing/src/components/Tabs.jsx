// A row of tabs over one panel: tab `${panelId}-${id}` controls the panel `panelId`, which names the active tab with
// aria-labelledby. Arrow keys move along the row, as a screen-reader user expects once it announces as a tablist.
export default function Tabs({ tokens, label, tabs, panelId, active, onSelect, style, tabStyle }) {
    const onKeyDown = (event) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        const i = tabs.findIndex((tab) => tab.id === active);
        const next = tabs[(i + step + tabs.length) % tabs.length].id;
        onSelect(next);
        event.currentTarget.querySelector(`[data-tab="${next}"]`)?.focus();
    };

    return (
        <div role="tablist" aria-label={label} onKeyDown={onKeyDown} style={{ display: 'flex', gap: 4, marginBottom: 10, ...style }}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`${panelId}-${tab.id}`}
                    data-tab={tab.id}
                    className="tap-target"
                    aria-selected={tab.id === active}
                    aria-controls={panelId}
                    tabIndex={tab.id === active ? 0 : -1}
                    onClick={() => onSelect(tab.id)}
                    style={{
                        background: tab.id === active ? tokens.pillBg : 'transparent',
                        border: `1px solid ${tab.id === active ? tokens.borderStrong : 'transparent'}`,
                        color: tab.id === active ? tokens.text : tokens.textDim,
                        borderRadius: 8,
                        padding: '5px 14px',
                        fontSize: 12.5,
                        fontFamily: tokens.mono,
                        cursor: 'pointer',
                        ...tabStyle?.(tab.id === active),
                    }}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
