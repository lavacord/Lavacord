// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import tsdocPlugin from 'eslint-plugin-tsdoc';
import { globalIgnores } from "eslint/config";

export default tseslint.config(
  globalIgnores(["docs", "dist", "node_modules"]),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
      "@typescript-eslint/no-explicit-any": ["error", {
            "ignoreRestArgs": true
        }],
      "@typescript-eslint/no-extraneous-class": ["error", {
        "allowStaticOnly": true,
      }],
    }
  },
  { 
    plugins: { tsdoc: tsdocPlugin },
    rules: {
      "tsdoc/syntax": "warn"
    },
  },

);

