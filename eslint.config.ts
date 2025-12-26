import js from "@eslint/js";
import imports from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: { globals: globals.node }
    },
    tseslint.configs.recommended,
    {
        plugins: {
            "unused-imports": unusedImports,
            import: imports
        },
        rules: {
            "@typescript-eslint/explicit-member-accessibility": "error",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/no-empty-interface": "off",
            "no-empty-function": "off",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-namespace": "off",
            "no-undef": "off",
            "no-restricted-syntax": [
                "error",
                {
                    selector: 'MethodDefinition[kind="get"], MethodDefinition[kind="set"]',
                    message:
                        "Getters and setters could create not obvious code execution flow. Please replace with method."
                }
            ],
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": "warn",
            "import/order": [
                "error",
                {
                    groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object", "type"]
                }
            ],
            "import/newline-after-import": "error",
            "import/no-useless-path-segments": "error"
        }
    },
    {
        ignores: ["dist/*"]
    }
]);
