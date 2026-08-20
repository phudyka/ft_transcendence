import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.venv/**",
      "frontend/public/**",
      "src/django/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["frontend/**/*.js", "frontend/**/*.mjs"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: [
      "src/realtime/**/*.mjs",
      "scripts/**/*.mjs",
      "eslint.config.js",
      "frontend/vite.config.js",
    ],
    languageOptions: { globals: globals.node },
  },
  {
    rules: {
      "no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
    },
  },
];
