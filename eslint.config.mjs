import pluginJs from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  pluginJs.configs.recommended,
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/website/**", "**/.cppjs/**", "**/.wrangler/**", "**/cppjs-core-embind-jsi/**"],
  },
  {
    // Define which files this object applies to
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // 'env' is replaced by 'globals' in Flat Config
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },

    // 3. Custom Rules
    rules: {
      indent: ["off", 2, {
        SwitchCase: 1,
      }],
      "max-len": ["off", {
        code: 125,
        tabWidth: 2,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      }],
      "import/extensions": "off",
      "no-use-before-define": "off",
      "no-unused-vars": "off",
    },
  },

  // 4. Override for CommonJS files
  // (Replaces the specific override you had for .eslintrc.{js,cjs})
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
]);
