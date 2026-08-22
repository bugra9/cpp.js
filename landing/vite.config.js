import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';
import { SITE } from './src/data.js';
import { GUIDE_ROUTES } from './src/guide/nav.js';

// The sitemap is derived from the same route list the prerenderer walks, so a new guide page
// cannot be prerendered and left out of it. Replaces the hand-written public/sitemap.xml; no
// lastmod, because a hand-maintained date goes stale without anyone noticing.
function sitemap() {
    return {
        name: 'sitemap',
        apply: 'build',
        closeBundle() {
            const urls = ['/', ...GUIDE_ROUTES].map((path) => `${SITE}${path}`);
            const xml = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                ...urls.map((url) => `    <url><loc>${url}</loc></url>`),
                '</urlset>',
                '',
            ].join('\n');
            writeFileSync(resolve(import.meta.dirname, 'dist/sitemap.xml'), xml);
        },
    };
}

// Preact via preset-vite: this page has three onClick handlers, so React's runtime was most
// of the bundle. Source keeps importing from 'react'; the preset aliases it to preact/compat.
//
// The prerender plugin bakes the rendered markup into index.html at build time, so clients that
// do not run JS - AI crawlers among them - get the whole page instead of an empty root element.
// It also walks the links returned by prerender(), which is how each /guide/ route gets its own
// static HTML file.
export default defineConfig({
    plugins: [
        preact(),
        vitePrerenderPlugin({ renderTarget: '#root' }),
        sitemap(),
    ],
    build: { outDir: 'dist' },
});
