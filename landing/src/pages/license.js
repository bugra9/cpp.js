import LICENSE_TEXT from '../../generated/license.js';
import { LIBRARIES_URL } from '../data.js';

// /license/: the repository's LICENSE, which prepare-site reads before every build, after a line on what it covers.
// Its first paragraph names the license; the rest are shown with their hard line breaks joined.
const [name, ...paragraphs] = LICENSE_TEXT.trim().split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' '));

export default {
    kind: 'document',
    slug: 'license',
    title: 'License',
    description: `crossbind is free under the ${name}; each prebuilt library package keeps the license of the library it wraps.`,
    lede: `crossbind is free under the ${name} below. Each prebuilt library package keeps the license of the library it wraps, which its page under [Libraries](${LIBRARIES_URL}) names.`,
    section: 'License',
    path: '/license',
    href: '/license/',
    eyebrow: { head: 'LICENSE', tail: '' },
    blocks: paragraphs.map((text) => ({ type: 'p', text })),
};
