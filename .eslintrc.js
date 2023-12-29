module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: 'airbnb-base',
    overrides: [
        {
            env: {
                node: true,
            },
            files: [
                '.eslintrc.{js,cjs}',
            ],
            parserOptions: {
                sourceType: 'script',
            },
        },
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        indent: [2, 4, {
            SwitchCase: 1,
        }],
        'max-len': [2, {
            code: 125,
            tabWidth: 4,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
        }],
        'import/extensions': 0,
        'no-use-before-define': 0,
    },
};
