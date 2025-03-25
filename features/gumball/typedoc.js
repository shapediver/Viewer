module.exports = {
	entryPoints: ["./src/index.ts"],
	out: "../../docs/features/gumball",
	exclude: ["**/__tests__/**/*", "**/tests/**/*"],
	name: "Viewer - Gumball",
	hideGenerator: true,
	disableSources: true,
	theme: "default",
	excludeExternals: false,
	excludePrivate: true,
	sort: ["required-first", "kind", "alphabetical"],
};
