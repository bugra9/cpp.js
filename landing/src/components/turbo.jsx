// Borland's Turbo C++ look, shared by the hero's code window and the playground's Turbo skin. The CGA palette, its blue
// a shade deeper than #0000aa so it doesn't outshout the headline on the white page. A DOS screen looks the same in
// both themes.
export const TURBO = Object.freeze({
    blue: '#00009a',
    gray: '#aaaaaa',
    green: '#00aa00',
    white: '#ffffff',
    yellow: '#ffff55',
    cyan: '#55ffff',
    lime: '#55ff55',
    black: '#000000',
    red: '#aa0000',
    lightRed: '#ff5555',
});

// Its editor's colours: reserved words white, literals cyan, comments gray, everything else yellow.
export const TURBO_SYNTAX = Object.freeze({ codeKey: TURBO.white, codeStr: TURBO.cyan, codeAccent: TURBO.cyan, codeMuted: TURBO.gray });

// The site theme's tokens as the playground's Turbo look sets them: the parts both looks share read these where the
// modern look reads the theme's, which a DOS screen ignores.
export function turboTokens(tokens) {
    return {
        ...tokens,
        ...TURBO_SYNTAX,
        sans: tokens.mono,
        text: TURBO.white,
        textDim: TURBO.white,
        textMuted: TURBO.gray,
        panel: TURBO.blue,
        panelAlt: TURBO.blue,
        codeBg: TURBO.blue,
        codeSurface: TURBO.blue,
        codeText: TURBO.yellow,
        border: TURBO.white,
        borderStrong: TURBO.white,
        pillBg: 'transparent',
        rowActiveBg: TURBO.cyan,
        rowActiveText: TURBO.black,
        rowRadius: 0,
        rowPadding: '0 8px',
        inputBg: TURBO.cyan,
        inputText: TURBO.black,
        accent: TURBO.cyan,
        accentText: TURBO.cyan,
        warn: TURBO.lightRed,
    };
}

// Each part of a window's title sits on its double top border, its background breaking the line.
export function TitlePart({ background = TURBO.blue, color = TURBO.white, style, children }) {
    return (
        <span aria-hidden="true" style={{ position: 'absolute', top: -11.5, padding: '0 4px', background, color, whiteSpace: 'pre', ...style }}>
            {children}
        </span>
    );
}

// A window: a double frame with the close box at the left of its title, the title in the middle and its number at the
// right. `label` names it for screen readers, since the title on the frame is drawn for the eye.
export function TurboWindow({
    title, number, label, background = TURBO.blue, frame = TURBO.white, closeBox = TURBO.lime, className, style, children, ...rest
}) {
    return (
        <section aria-label={label ?? title} className={className} style={{ position: 'relative', border: `3px double ${frame}`, background, ...style }} {...rest}>
            <TitlePart background={background} color={frame} style={{ left: 8 }}>[<span style={{ color: closeBox }}>■</span>]</TitlePart>
            {title && <TitlePart background={background} color={frame} style={{ left: '50%', transform: 'translateX(-50%)' }}>{title}</TitlePart>}
            {number && <TitlePart background={background} color={frame} style={{ right: 8 }}>{number}</TitlePart>}
            {children}
        </section>
    );
}
