// Line drawings for the platform band under the hero, in the current text colour. Fixed opacities
// for outlines, placeholder blocks and solid details keep the same contrast in both themes.
const OUTLINE = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeOpacity: 0.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const BLOCK = { fill: 'currentColor', fillOpacity: 0.18 };
const SOLID = { fill: 'currentColor', fillOpacity: 0.7 };
const VIEW_HEIGHT = 92;

const SCENES = {
    browser: {
        width: 140,
        body: () => (
            <>
                <rect x="1.25" y="1.25" width="137.5" height="89.5" rx="8" {...OUTLINE} />
                <path d="M1.25 18h137.5" {...OUTLINE} />
                <rect x="12" y="6" width="116" height="7" rx="3.5" {...BLOCK} />
                <rect x="12" y="28" width="70" height="52" rx="4" {...BLOCK} />
                <rect x="92" y="28" width="36" height="9" rx="3" {...BLOCK} />
                <rect x="92" y="43" width="36" height="6" rx="3" {...BLOCK} />
                <rect x="92" y="55" width="24" height="6" rx="3" {...BLOCK} />
            </>
        ),
    },
    phone: {
        width: 52,
        body: () => (
            <>
                <rect x="1.25" y="1.25" width="49.5" height="89.5" rx="9" {...OUTLINE} />
                <rect x="19" y="7" width="14" height="4" rx="2" {...SOLID} />
                <rect x="8" y="18" width="36" height="14" rx="3" {...BLOCK} />
                <rect x="8" y="36" width="36" height="14" rx="3" {...BLOCK} />
                <rect x="8" y="54" width="36" height="28" rx="3" {...BLOCK} />
            </>
        ),
    },
    cloud: {
        width: 132,
        body: () => (
            <>
                <path d="M34 80H100a22 22 0 0 0 4-43.6a30 30 0 0 0-56-10.4a24 24 0 0 0-14 54z" {...OUTLINE} />
                <rect x="46" y="48" width="44" height="7" rx="3.5" {...BLOCK} />
                <rect x="46" y="61" width="30" height="7" rx="3.5" {...BLOCK} />
            </>
        ),
    },
    laptop: {
        width: 150,
        body: () => (
            <>
                <rect x="16" y="1.25" width="118" height="74" rx="6" {...OUTLINE} />
                <rect x="26" y="10" width="56" height="36" rx="3" {...BLOCK} />
                <rect x="66" y="26" width="58" height="40" rx="3" {...BLOCK} />
                <rect x="2" y="80" width="146" height="10" rx="4" {...SOLID} />
            </>
        ),
    },
    terminal: {
        width: 110,
        body: () => (
            <>
                <rect x="1.25" y="1.25" width="107.5" height="89.5" rx="8" {...OUTLINE} />
                <path d="M16 30l9 7-9 7M31 44h12" {...OUTLINE} />
                <rect x="16" y="56" width="62" height="6" rx="3" {...BLOCK} />
                <rect x="16" y="68" width="44" height="6" rx="3" {...BLOCK} />
            </>
        ),
    },
};

export default function PlatformScene({ id, height = 84 }) {
    const { width, body } = SCENES[id];
    return (
        <svg
            viewBox={`0 0 ${width} ${VIEW_HEIGHT}`}
            width={(width * height) / VIEW_HEIGHT}
            height={height}
            aria-hidden="true"
            focusable="false"
        >
            {body()}
        </svg>
    );
}
