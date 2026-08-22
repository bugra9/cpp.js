import { useId } from 'react';

// Two strands crossing, one woven under the other: "cross" and "bind" in one mark.
// Colours come from the tokens so it stays readable in both themes.
export default function Logo({ tokens, size = 28 }) {
    const gradientId = useId();

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
                <linearGradient id={gradientId} x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor={tokens.blue} />
                    <stop offset="1" stopColor={tokens.violet} />
                </linearGradient>
            </defs>
            {/* under-strand, broken where the other passes over it */}
            <path
                d="M20.4 3.6 L14.3 9.7 M9.7 14.3 L3.6 20.4"
                stroke={`url(#${gradientId})`}
                strokeWidth="3.8"
                strokeLinecap="round"
            />
            {/* over-strand */}
            <path
                d="M3.6 3.6 L20.4 20.4"
                stroke={tokens.accent}
                strokeWidth="3.8"
                strokeLinecap="round"
            />
        </svg>
    );
}
