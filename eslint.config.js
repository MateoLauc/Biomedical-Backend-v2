import js from "@eslint/js";
import tseslint from "typescript-eslint";

const tsFiles = ["**/*.ts"];
const repoFiles = ["**/repo.ts", "**/repositories/**/*.ts"];

export default [
  {
    ignores: ["dist/**", "node_modules/**", "npm-cache/**", "scripts/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((c) => ({ ...c, files: tsFiles })),
  // Exclude repo files from type-checked rules to avoid false positives with Drizzle's complex generics
  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    files: tsFiles,
    ignores: repoFiles
  })),
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
  },
  {
    // Disable strict type-checking for repo files that use Drizzle ORM
    // Drizzle's complex generic types cause false positives with TypeScript's compiler diagnostics
    files: repoFiles,
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off"
    }
  }
];

