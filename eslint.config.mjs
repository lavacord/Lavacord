// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { globalIgnores } from "eslint/config";

export default tseslint.config(
  globalIgnores(["docs"]),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    ignores: ["node_modules", "docs", "dist"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
      "@typescript-eslint/no-explicit-any": ["error", {
            "ignoreRestArgs": true
        }]
    }
  }
);

