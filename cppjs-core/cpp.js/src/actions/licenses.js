import fs from 'node:fs';
import state from '../state/index.js';
import loadJs from '../utils/loadJs.js';
import { isCopyleft } from '../utils/licenseReport.js';

const LICENSE_FILES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING'];

export default async function collectLicenseRows() {
    const rows = [];
    for (const dep of state.config.allDependencies) {
        const recipe = await loadJs(dep.paths.project, 'cppjs.build');
        const nativeVersion = dep.package?.nativeVersion || null;
        let sourceUrl = null;
        if (recipe?.getURL && nativeVersion) {
            try {
                sourceUrl = recipe.getURL(nativeVersion);
            } catch (e) {
                sourceUrl = null;
            }
        }
        if (!sourceUrl) sourceUrl = dep.package?.homepage || null;
        const licenseFile = LICENSE_FILES
            .map((name) => `${dep.paths.project}/${name}`)
            .find((file) => fs.existsSync(file));
        const license = dep.package?.license || null;
        rows.push({
            name: dep.general.name,
            npmName: dep.package?.name || null,
            version: dep.package?.version || null,
            nativeVersion,
            license,
            sourceUrl,
            licenseText: licenseFile ? fs.readFileSync(licenseFile, 'utf8') : null,
            isCopyleft: isCopyleft(license),
        });
    }
    return rows.sort((a, b) => a.name.localeCompare(b.name));
}
