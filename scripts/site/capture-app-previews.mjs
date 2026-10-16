import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { APP_LIST, PREVIEW_HEIGHT, PREVIEW_THEMES, PREVIEW_WIDTH, previewOf } from '../../landing/src/apps/appList.js';

// The pictures on /examples/: every library app run once on its library's page in each theme, its output saved as
// the WebP its card shows. `pnpm run previews` runs this under prepare-site, which it needs to start the landing dev
// server, once `pnpm run demos` has built the modules the apps load; the deploy check (assertAppPreviews) refuses a
// site that lacks a picture. --base-url points it at a site that is already running, --only at some of the apps.

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LANDING = path.join(REPOSITORY_ROOT, 'landing');
const PUBLIC_DIR = path.join(LANDING, 'public');
const VIEWPORT = { width: 1400, height: 1000 };
const PIXEL_RATIO = 2;
const INSET = 24;
const RUN_TIMEOUT_MS = 120_000;
const SETTLE_MS = 1500;
const QUALITY = 0.82;
const ATTEMPTS = 2;
// The site's sticky header would cover the top of an output in the screenshot.
const STATIC_HEADER = 'header { position: static !important; }';
// landing/src/theme.js's THEME_KEY; that module imports Preact, so Node cannot load it.
const THEME_KEY = 'crossbind.landing.theme';

const log = (message) => process.stderr.write(`${message}\n`);
const firstLine = (error) => error.message.split('\n')[0];

// How much of a width x height screenshot the preview shows: its full width, from the top, where an app puts its
// result first. A tall output is cut at the bottom; a short one leaves the rest of the frame to its background, so
// no line loses its start and every preview shows text at the same size.
export function previewArea(width, height, frameWidth, frameHeight) {
    const scale = frameWidth / width;
    const shown = Math.min(height, frameHeight / scale);
    return { width, height: shown, drawnHeight: shown * scale };
}

// The pictures of the apps that are missing under root: public/ before a build, dist/ after it.
export const missingPreviews = (root) =>
    APP_LIST.flatMap((app) => PREVIEW_THEMES.map((theme) => previewOf(app.id, theme))).filter((href) => !fs.existsSync(path.join(root, href)));

export function assertAppPreviews(distRoot) {
    const missing = missingPreviews(distRoot);
    if (missing.length) {
        const more = missing.length > 3 ? ` and ${missing.length - 3} more` : '';
        throw new Error(`app pictures are missing: ${missing.slice(0, 3).join(', ')}${more}; run pnpm run previews before the build.`);
    }
    return APP_LIST.length;
}

// No file watching: an edit during the capture would reload the page under it.
async function startSite() {
    const require = createRequire(path.join(LANDING, 'package.json'));
    const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
    const server = await createServer({
        root: LANDING,
        configFile: path.join(LANDING, 'vite.config.js'),
        logLevel: 'warn',
        server: { host: '127.0.0.1', port: 0, watch: null },
    });
    await server.listen();
    return { url: server.resolvedUrls.local[0], close: () => server.close() };
}

// The workspace has Playwright through the e2e packages; a machine that never downloaded its browser has Chrome.
async function launchBrowser() {
    const require = createRequire(path.join(REPOSITORY_ROOT, 'e2e', 'web-vite', 'package.json'));
    const { chromium } = require('@playwright/test');
    return chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
}

async function openLibraryPage(page, siteUrl, family) {
    await page.goto(new URL(`/ports/${family}/`, siteUrl).href, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: STATIC_HEADER });
    if (!(await page.locator('article[data-app]').count()))
        throw new Error(`/ports/${family}/ shows no apps; build its module first (pnpm run demos)`);
}

// Every app shows itself at work from its first run button, on the sample it opens with.
async function runApp(page, card, app) {
    await card.locator('[data-run]:not([disabled])').first().click();
    await page.waitForFunction((id) => !['idle', 'running'].includes(document.querySelector(`article[data-app="${id}"]`)?.dataset.status), app.id, {
        timeout: RUN_TIMEOUT_MS,
    });
    const status = await card.getAttribute('data-status');
    if (status !== 'ready') throw new Error(`the run ended ${status}`);
}

// The output is drawn inset on its card's background, so it does not touch the frame. PNG keeps its width and height
// at bytes 16 and 20.
async function toWebp(converter, png, background) {
    const base64 = await converter.evaluate(
        async ({ source, area, fill, width, height, inset, quality }) => {
            const image = new Image();
            image.src = `data:image/png;base64,${source}`;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            context.fillStyle = fill;
            context.fillRect(0, 0, width, height);
            context.imageSmoothingQuality = 'high';
            context.drawImage(image, 0, 0, area.width, area.height, inset, inset, width - 2 * inset, area.drawnHeight);
            return canvas.toDataURL('image/webp', quality).split(',')[1];
        },
        {
            source: png.toString('base64'),
            area: previewArea(png.readUInt32BE(16), png.readUInt32BE(20), PREVIEW_WIDTH - 2 * INSET, PREVIEW_HEIGHT - INSET),
            fill: background,
            width: PREVIEW_WIDTH,
            height: PREVIEW_HEIGHT,
            inset: INSET,
            quality: QUALITY,
        },
    );
    return Buffer.from(base64, 'base64');
}

// A page that reloads under the run (a late dependency optimisation, say) shows the app as it was before it; the
// status read after the screenshot catches that.
async function captureApp(page, converter, app, theme) {
    const card = page.locator(`article[data-app="${app.id}"]`);
    await card.scrollIntoViewIfNeeded();
    await runApp(page, card, app);
    await page.waitForTimeout(SETTLE_MS);
    const png = await card.locator('[data-output]').screenshot();
    if ((await card.getAttribute('data-status')) !== 'ready') throw new Error('the page reset during the run');
    const background = await card.evaluate((element) => getComputedStyle(element).backgroundColor);
    const file = path.join(PUBLIC_DIR, previewOf(app.id, theme));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, await toWebp(converter, png, background));
}

// A failed capture gets another try on a freshly opened page.
async function captureWithRetry(page, converter, siteUrl, app, theme) {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
        const started = Date.now();
        try {
            if (attempt > 1) await openLibraryPage(page, siteUrl, app.family);
            await captureApp(page, converter, app, theme);
            log(`${app.id} (${theme}): captured in ${((Date.now() - started) / 1000).toFixed(1)} s`);
            return true;
        } catch (error) {
            log(`${app.id} (${theme}): attempt ${attempt} failed (${firstLine(error)})`);
        }
    }
    return false;
}

// The site opens light unless a visitor chose dark, which it keeps in local storage, so each theme is a page of its
// own with that choice made.
async function captureTheme(browser, converter, siteUrl, apps, theme) {
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: PIXEL_RATIO });
    await page.addInitScript(([key, choice]) => localStorage.setItem(key, choice), [THEME_KEY, theme]);
    const failed = [];
    for (const family of new Set(apps.map((app) => app.family))) {
        const members = apps.filter((app) => app.family === family);
        try {
            await openLibraryPage(page, siteUrl, family);
        } catch (error) {
            log(`${family} (${theme}): ${firstLine(error)}`);
            failed.push(...members.map((app) => `${app.id} (${theme})`));
            continue;
        }
        for (const app of members) {
            if (!(await captureWithRetry(page, converter, siteUrl, app, theme))) failed.push(`${app.id} (${theme})`);
        }
    }
    await page.close();
    return failed;
}

export async function captureAppPreviews({ baseUrl, only } = {}) {
    const unknown = (only ?? []).filter((id) => !APP_LIST.some((app) => app.id === id));
    if (unknown.length) throw new Error(`there is no app ${unknown.join(', ')}.`);
    const apps = only ? APP_LIST.filter((app) => only.includes(app.id)) : APP_LIST;
    const site = baseUrl ? { url: baseUrl, close: async () => {} } : await startSite();
    try {
        const browser = await launchBrowser();
        try {
            const converter = await browser.newPage();
            const failed = [];
            for (const theme of PREVIEW_THEMES) failed.push(...(await captureTheme(browser, converter, site.url, apps, theme)));
            return { captured: apps.length * PREVIEW_THEMES.length - failed.length, failed };
        } finally {
            await browser.close();
        }
    } finally {
        await site.close();
    }
}

async function main(argv) {
    const valueOf = (flag) => {
        const index = argv.indexOf(flag);
        return index === -1 ? undefined : argv[index + 1];
    };
    const { captured, failed } = await captureAppPreviews({ baseUrl: valueOf('--base-url'), only: valueOf('--only')?.split(',') });
    log(`Captured ${captured} app pictures.`);
    if (failed.length) throw new Error(`no picture of ${failed.join(', ')}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main(process.argv.slice(2)).catch((error) => {
        log(`capture-app-previews: ${error.message}`);
        process.exit(1);
    });
}
