module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    root: true,
    overrides: [
        {
          files: ["*.{ts,tsx}"],
          rules: {
            "@typescript-eslint/switch-exhaustiveness-check": "error",
          },
          parser: "@typescript-eslint/parser",
          parserOptions: {
            "project": "./tsconfig.json"
          }
        }
      ],
};