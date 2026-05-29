import eslint from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
	eslint.configs.recommended,
	// @typescript-eslint recommended flat config (sets up parser + plugin rules)
	...tsPlugin.configs["flat/recommended"],
	// Disables ESLint rules that conflict with Prettier
	prettierConfig,
	// Prettier plugin rules (applies to all files)
	{
		plugins: {prettier: prettierPlugin},
		rules: {
			"prettier/prettier": "error",
			"@typescript-eslint/no-inferrable-types": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-empty-function": "off",
			"linebreak-style": ["error", "windows"],
			quotes: ["error", "double"],
			semi: ["error", "always"],
			"@typescript-eslint/no-explicit-any": 0,
			"no-debugger": 0,
		},
	},
	// TypeScript-specific rules requiring type information
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
		rules: {
			"@typescript-eslint/switch-exhaustiveness-check": "error",
		},
	},
	// Ignore build outputs and dependencies
	{
		ignores: [
			"**/dist/**",
			"**/node_modules/**",
			"**/*.js",
			"**/*.mjs",
			"**/*.cjs",
		],
	},
];
