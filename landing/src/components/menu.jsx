import { useEffect, useRef } from 'react';

// What the navbar's link row and its two menus share, so the Docs menu and the version menu
// cannot drift apart.

export const isUnder = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);

export const navLinkStyle = (tokens, active) => ({
    padding: '7px 14px',
    borderRadius: 8,
    fontSize: 14,
    color: active ? tokens.text : tokens.textDim,
    background: active ? tokens.pillBg : 'transparent',
    fontWeight: active ? 600 : 400,
});

export function Chevron() {
    return (
        <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ transition: 'transform 0.15s' }}
        >
            <path d="M6 9l6 6 6-6" />
        </svg>
    );
}

// Closes on Escape and once a click or focus lands outside the menu. Listening from mount rather
// than while open keeps a click right after opening from slipping in before the effect runs.
function useMenu() {
    const root = useRef(null);

    useEffect(() => {
        const close = () => {
            if (root.current) root.current.open = false;
        };
        const onKey = (event) => {
            if (event.key !== 'Escape') return;
            // Focus inside the panel would drop to the page once it hides, so it goes back to the trigger.
            if (root.current?.contains(document.activeElement)) root.current.querySelector('summary')?.focus();
            close();
        };
        const onOutside = (event) => {
            if (!root.current?.contains(event.target)) close();
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onOutside);
        document.addEventListener('focusin', onOutside);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onOutside);
            document.removeEventListener('focusin', onOutside);
        };
    }, []);

    return root;
}

const menuPanelStyle = (tokens) => ({
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    minWidth: 180,
    padding: 6,
    borderRadius: 12,
    background: tokens.panelRaised,
    border: `1px solid ${tokens.borderStrong}`,
    boxShadow: tokens.isLight ? '0 12px 32px rgba(0,0,0,0.12)' : '0 16px 40px rgba(0,0,0,0.45)',
    zIndex: 6,
});

const menuItemStyle = (tokens, current) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: '8px 10px',
    borderRadius: 8,
    fontSize: 13.5,
    color: current ? tokens.text : tokens.textDim,
    fontWeight: current ? 600 : 400,
    background: current ? tokens.pillBg : 'transparent',
});

// A <details> opens without JavaScript too, so the links stay one click away before the page hydrates and without it.
// Whether it is open lives on the element alone, so no state can fall behind a click.
export function NavMenu({ tokens, label, active, items, className = '', style, panelStyle }) {
    const root = useMenu();

    return (
        <details ref={root} className={`nav-dropdown ${className}`.trim()} style={{ position: 'relative', ...style }}>
            <summary className="tap-target nav-link" style={{ ...navLinkStyle(tokens, active), gap: 6, cursor: 'pointer', listStyle: 'none' }}>
                {label}
                <Chevron />
            </summary>
            <div className="nav-dropdown-panel" style={{ ...menuPanelStyle(tokens), ...panelStyle }}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {items.map((item) => (
                        <li key={item.label}>
                            <a
                                href={item.href}
                                target={item.external ? '_blank' : undefined}
                                rel={item.external ? 'noreferrer' : undefined}
                                aria-current={item.current ? 'page' : undefined}
                                className="tap-target menu-item"
                                style={menuItemStyle(tokens, item.current)}
                            >
                                {item.label}
                                {item.external && <span style={{ fontFamily: tokens.mono, fontSize: 11, color: tokens.textMuted }}>↗</span>}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </details>
    );
}
