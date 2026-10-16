import { EXAMPLES_URL, TUTORIAL_URL } from '../data.js';
import { guideHref, normalizePath } from '../guide/nav.js';
import { isUnder, NavMenu } from './menu.jsx';

const ITEMS = [
    { label: 'Guide', href: guideHref() },
    { label: 'Tutorial', href: TUTORIAL_URL },
    { label: 'Examples', href: EXAMPLES_URL },
];

export default function DocsMenu({ tokens, path, active }) {
    const here = normalizePath(path);
    const items = ITEMS.map((item) => ({ ...item, current: isUnder(here, normalizePath(item.href)) }));

    return <NavMenu tokens={tokens} label="Docs" active={active} items={items} />;
}
