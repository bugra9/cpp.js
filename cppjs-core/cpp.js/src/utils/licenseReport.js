import spdxParse from 'spdx-expression-parse';

const COPYLEFT_PATTERN = /\b(AGPL|LGPL|GPL|MPL|EPL|EUPL|CDDL)\b/i;

export function isCopyleft(expression) {
    return COPYLEFT_PATTERN.test(expression || '');
}

export function validateSpdx(expression) {
    if (!expression || typeof expression !== 'string') {
        return { isValid: false, error: 'missing license field' };
    }
    try {
        spdxParse(expression);
        return { isValid: true };
    } catch (e) {
        return { isValid: false, error: e.message };
    }
}

export function formatNoticesMarkdown(rows) {
    const sections = [...rows]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((row) => {
            const lines = [`## ${row.name}${row.license ? ` — ${row.license}` : ''}`, ''];
            if (row.npmName) lines.push(`- package: ${row.npmName}${row.version ? `@${row.version}` : ''}`);
            if (row.nativeVersion) lines.push(`- native version: ${row.nativeVersion}`);
            if (row.sourceUrl) lines.push(`- source: ${row.sourceUrl}`);
            if (row.licenseText) lines.push('', '```', row.licenseText.trim(), '```');
            return lines.join('\n');
        });

    return [
        '# Third-Party Notices',
        '',
        'This application bundles the following native libraries through cpp.js packages.',
        '',
        sections.join('\n\n'),
        '',
    ].join('\n');
}
