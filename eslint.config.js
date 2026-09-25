import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["assets/js/**/*.js"],
    languageOptions: { globals: globals.browser },
    rules: {
      ...js.configs.recommended.rules,
      "no-empty": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
