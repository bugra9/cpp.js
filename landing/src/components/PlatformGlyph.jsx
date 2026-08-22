// Inline platform marks so the page ships without image assets.
export default function PlatformGlyph({ id, size = 18, color = '#fff' }) {
    const stroke = { fill: 'none', stroke: color, strokeWidth: 1.5 };

    switch (id) {
        case 'chrome':
            return (
                <svg viewBox="0 0 24 24" width={size} height={size} {...stroke}>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3.5" />
                    <path d="M12 2 L12 8.5 M3.5 7 L9.5 10.5 M20.5 7 L14.5 10.5" />
                </svg>
            );
        case 'firefox':
            return (
                <svg viewBox="0 0 24 24" width={size} height={size} {...stroke}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M6 14c2 4 8 5 11 1c2-3 1-6-1-8c-1 2-3 3-5 2c-2-1-3-3-2-5c-3 1-6 4-6 8c0 4 3 7 7 7" />
                </svg>
            );
        case 'safari':
            return (
                <svg viewBox="0 0 24 24" width={size} height={size} {...stroke}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M16 8 L13 13 L8 16 L11 11 Z" fill={color} />
                    <circle cx="12" cy="12" r="0.5" fill={color} />
                </svg>
            );
        case 'node':
            return (
                <svg viewBox="0 0 24 24" width={size} height={size} {...stroke}>
                    <path d="M12 2 L20.5 7 L20.5 17 L12 22 L3.5 17 L3.5 7 Z" />
                    <path d="M9 9 L9 15 a2 2 0 0 0 4 0 L13 9 M15 14 a2 2 0 0 0 2 2 a2 2 0 0 0 2 -2 a2 2 0 0 0 -2 -2 a2 2 0 0 1 -2 -2 a2 2 0 0 1 2 -2 a2 2 0 0 1 2 2" />
                </svg>
            );
        case 'cf':
            return (
                <svg viewBox="0 0 24 24" width={size} height={size} {...stroke}>
                    <path d="M5 16 Q5 11 10 11 Q12 8 16 9 Q20 9 20 13 Q22 13 22 15 Q22 17 20 17 L7 17 Q5 17 5 16Z" />
                </svg>
            );
        case 'rn':
            return (
                <svg viewBox="0 0 24 24" width={size} height={size} {...stroke}>
                    <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
                </svg>
            );
        case 'wasi':
            // WASI ships as standalone commands, so a prompt reads truer than a wasm mark.
            return (
                <svg viewBox="0 0 24 24" width={size} height={size} {...stroke}>
                    <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
                    <path d="M7 10l3 2.5-3 2.5M12.5 15.5h4.5" />
                </svg>
            );
        case 'ios':
            return (
                <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
                    <path d="M17 17.5c-.7 1.5-1.5 3-2.8 3-1.3 0-1.7-.8-3.2-.8-1.5 0-1.9.8-3.1.8-1.3 0-2.2-1.4-3-2.8-1.6-2.5-2.8-7.2-1.2-10.3.8-1.6 2.4-2.6 4-2.6 1.3 0 2.5.9 3.3.9.8 0 2.3-1.1 3.8-.9 0.6 0 2.5.2 3.6 1.9-3.1 1.7-2.6 6.1.6 7.8zM13.5 4.5c.7-.8 1-2 .9-3-1 .1-2.1.6-2.8 1.4-.6.7-1.1 1.9-.9 3 1 .1 2.1-.5 2.8-1.4z" />
                </svg>
            );
        case 'android':
            return (
                <svg viewBox="0 0 24 24" width={size} height={size} {...stroke}>
                    <path d="M5 10 Q12 5 19 10 L19 16 Q12 19 5 16 Z" />
                    <circle cx="9" cy="13" r="0.5" fill={color} />
                    <circle cx="15" cy="13" r="0.5" fill={color} />
                    <path d="M6 10 L4 6 M18 10 L20 6" />
                </svg>
            );
        default:
            return null;
    }
}
