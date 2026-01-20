import js from "@eslint/js";
import tseslint from "typescript-eslint";

const tsFiles = ["**/*.ts"];

export default [
  {
    ignores: ["dist/**", "node_modules/**", "npm-cache/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((c) => ({ ...c, files: tsFiles })),
  ...tseslint.configs.recommendedTypeChecked.map((c) => ({ ...c, files: tsFiles })),
  {
    files: tsFiles,
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false
        }
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }
      ]
    }
  }
];

