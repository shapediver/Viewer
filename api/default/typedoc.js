module.exports = {
	entryPoints: ["./src/index.ts"],
	out: "../../docs",
	exclude: ["**/__tests__/**/*", "**/tests/**/*"],
	name: "Viewer",
	hideGenerator: true,
	disableSources: true,
	theme: "default",
	excludeExternals: false,
	excludePrivate: true,
	sort: ["required-first", "kind", "alphabetical"],
};
