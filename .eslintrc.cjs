// eslint-disable-next-line no-undef
module.exports = {
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:prettier/recommended",
		"prettier",
	],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "eslint-plugin-prettier"],
	root: true,
	overrides: [
		{
			files: ["*.{ts,tsx}"],
			rules: {
				"@typescript-eslint/switch-exhaustiveness-check": "error",
			},
			parser: "@typescript-eslint/parser",
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
	],
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
};
