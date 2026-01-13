const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execAsync = util.promisify(exec);

async function checkPackages() {
    const findCmd = 'find . -name "package.json" -maxdepth 4';
    const { stdout } = await execAsync(findCmd);
    const packagePaths = stdout.split('\n').filter(p => p.trim());

    console.log(`Found ${packagePaths.length} packages. Checking status...`);

    const results = [];
    const limit = 20; // Increase concurrency for speed
    let active = 0;
    let index = 0;

    const next = async () => {
        if (index >= packagePaths.length) return;
        const i = index++;
        const pkgPath = packagePaths[i];

        try {
            const content = fs.readFileSync(pkgPath, 'utf8');
            const pkg = JSON.parse(content);
            const name = pkg.name;

            if (name) {
                try {
                    const { stdout: betaVersion } = await execAsync(`npm view ${name} dist-tags.beta`, { timeout: 10000 });
                    const version = betaVersion.trim();

                    if (version) {
                        const { stdout: sizeBytes } = await execAsync(`npm view ${name}@${version} dist.unpackedSize`, { timeout: 10000 });
                        const sizeMB = (parseInt(sizeBytes.trim()) / 1024 / 1024).toFixed(2) + ' MB';
                        results.push({ name, version, size: sizeMB, published: true });
                    } else {
                        results.push({ name, published: false, reason: 'No beta tag' });
                    }
                } catch (e) {
                    results.push({ name, published: false, reason: 'Not found or error' });
                }
            }
        } catch (e) {
            // Ignore read errors
        }

        process.stdout.write('.');
        await next();
    };

    const workers = [];
    for (let i = 0; i < limit; i++) {
        workers.push(next());
    }
    await Promise.all(workers);

    // Generate Markdown
    let md = '# Beta Release Status\n\n';
    md += `Generated on: ${new Date().toISOString()}\n\n`;

    const notPublished = results.filter(r => !r.published);
    const released = results.filter(r => r.published);

    if (notPublished.length > 0) {
        md += '## ⚠️ Unreleased / Missing Beta Tag\n\n';
        md += '| Package Name | Reason |\n|---|---|\n';
        notPublished.forEach(r => {
            md += `| ${r.name} | ${r.reason} |\n`;
        });
        md += '\n';
    } else {
        md += '## ✅ All packages have a beta release\n\n';
    }

    md += `## Released Packages (Alphabetical Order) (${released.length})\n\n`;
    md += '| Package Name | Version | Size |\n|---|---|---|\n';
    released.sort((a, b) => b.name.localeCompare(a.name));
    released.forEach(r => {
        md += `| ${r.name} | ${r.version} | ${r.size} |\n`;
    });

    md += `## Released Packages (Size Order) (${released.length})\n\n`;
    md += '| Package Name | Version | Size |\n|---|---|---|\n';
    released.sort((a, b) => parseFloat(b.size) - parseFloat(a.size));

    released.forEach(r => {
        md += `| ${r.name} | ${r.version} | ${r.size} |\n`;
    });

    const reportPath = path.join('.', 'beta-releases.md');
    fs.writeFileSync(reportPath, md);
    console.log(`\n\nReport saved to ${reportPath}`);
}

checkPackages();
