import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'crossbind.landing.theme';

// The brand palette. Light mode darkens the three tones so they stay readable on white.
const P = { a: '#7afa96', b: '#5ba3e3', c: '#a78bfa' };
const LIGHT_ACCENT = '#166534';
const LIGHT_BLUE = '#1e6bb8';
const LIGHT_VIOLET = '#6d28d9';

// "Geist Sans" is the family name @fontsource ships; Google Fonts called the same face "Geist".
const SANS = '"Geist Sans", "Geist", -apple-system, BlinkMacSystemFont, sans-serif';
const MONO = '"Geist Mono", ui-monospace, monospace';

function lightTokens() {
    return {
        bg: '#fafaf7',
        bgGrad: `radial-gradient(ellipse 80% 60% at 50% -10%, ${P.b}1c, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 30%, ${P.a}14, transparent 60%), #fafaf7`,
        panel: '#ffffff',
        panelAlt: '#f4f2ec',
        border: 'rgba(0,0,0,0.08)',
        borderStrong: 'rgba(0,0,0,0.13)',
        text: '#0a0a0a',
        textDim: '#525560',
        // Muted tones are measured against the darkest surface they sit on (panelAlt /
        // codeSurface) so every use clears WCAG AA 4.5:1, not just the ones on white.
        textMuted: '#6a6d76',
        // Accent darkens in light mode so `color: tokens.accent` stays readable on white.
        accent: LIGHT_ACCENT,
        accentBright: P.a,
        accentText: LIGHT_ACCENT,
        blue: LIGHT_BLUE,
        violet: LIGHT_VIOLET,
        buttonBg: '#0a0a0a',
        buttonText: '#fff',
        // Overlay surfaces sit above the page, so they get their own elevation set.
        panelRaised: '#ffffff',
        borderRaised: 'rgba(0,0,0,0.13)',
        raisedShadow: '0 24px 60px rgba(15,18,25,0.18)',
        pillBg: 'rgba(0,0,0,0.04)',
        pillBorder: 'rgba(0,0,0,0.08)',
        // Syntax colours are fixed like a real editor; only the number colour tracks the brand.
        codeBg: '#fbf9f2',
        codeSurface: '#f4f1e6',
        codeText: '#1a1a1a',
        codeMuted: '#716a5a',
        warn: '#9a3412',
        codeKey: '#7c3aed',
        codeStr: '#b8501e',
        codeAccent: LIGHT_ACCENT,
        isLight: true,
        navBg: 'rgba(250,250,247,0.78)',
        glow: `${P.a}22`,
        sans: SANS,
        mono: MONO,
    };
}

function darkTokens() {
    return {
        bg: '#070b14',
        bgGrad: `radial-gradient(ellipse 80% 60% at 50% -10%, ${P.b}26, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 30%, ${P.a}14, transparent 60%), #070b14`,
        panel: '#0d1322',
        panelAlt: '#121929',
        border: 'rgba(255,255,255,0.07)',
        borderStrong: 'rgba(255,255,255,0.13)',
        text: '#e7ebf3',
        textDim: '#9aa3b5',
        textMuted: '#78829a',
        accent: P.a,
        accentBright: P.a,
        accentText: P.a,
        blue: P.b,
        violet: P.c,
        buttonBg: '#e7ebf3',
        buttonText: '#070b14',
        // `panel` only clears the page by 1.08:1, which reads as a flat block once dimmed by a backdrop.
        panelRaised: '#1c2438',
        borderRaised: 'rgba(255,255,255,0.18)',
        raisedShadow: '0 28px 70px rgba(0,0,0,0.6)',
        pillBg: 'rgba(255,255,255,0.04)',
        pillBorder: 'rgba(255,255,255,0.07)',
        codeBg: '#0d1322',
        codeSurface: 'rgba(255,255,255,0.03)',
        codeText: '#e7ebf3',
        codeMuted: '#78829a',
        warn: '#f4b893',
        codeAccent: P.a,
        codeKey: P.c,
        codeStr: '#f4b893',
        isLight: false,
        navBg: 'rgba(7,11,20,0.7)',
        glow: `${P.a}33`,
        sans: SANS,
        mono: MONO,
    };
}

export function resolveTokens(theme) {
    return theme === 'light' ? lightTokens() : darkTokens();
}

function readStoredTheme() {
    try {
        const stored = localStorage.getItem(THEME_KEY);
        return stored === 'light' || stored === 'dark' ? stored : null;
    } catch {
        return null;
    }
}

export function useTheme(fallback = 'dark') {
    // Hydration has to start on the theme the prerender baked in. Preact's hydrate() does not
    // write props onto existing DOM, so if the first client render already used the stored
    // theme, vdom and DOM would disagree with no diff left to reconcile them and the page
    // would stay in the prerendered theme. Applying the stored value on the next render
    // produces a real diff instead; the inline script in index.html paints the canvas first,
    // so the swap does not read as a flash.
    const [theme, setTheme] = useState(fallback);

    useEffect(() => {
        const stored = readStoredTheme();
        if (stored) setTheme(stored);
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch {
            // Private-mode browsers reject writes; the in-memory theme still works.
        }
        // The canvas comes from <html>; styling only <body> leaves the stylesheet's dark default behind.
        const { bg } = resolveTokens(theme);
        document.documentElement.style.background = bg;
        document.documentElement.style.colorScheme = theme;
        document.body.style.background = bg;
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((current) => (current === 'light' ? 'dark' : 'light'));
    }, []);

    return [theme, toggleTheme];
}
