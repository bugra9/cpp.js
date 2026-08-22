import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// Upstream truth (license, provenance identity) lives on the FAMILY package (contract D);
// variants depend on their family.
export default function familyManifestOf(node) {
    const familyName = node.general?.alias?.package;
    if (!familyName || !node.paths?.project) return null;
    try {
        const req = createRequire(path.join(node.paths.project, 'package.json'));
        const manifestPath = req.resolve(`${familyName}/package.json`);
        return { manifest: JSON.parse(fs.readFileSync(manifestPath, 'utf8')), dir: path.dirname(manifestPath) };
    } catch {
        return null;
    }
}
