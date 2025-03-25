module.exports = {
	entryPoints: ["./src/index.ts"],
	out: "../../docs/features/attribute-visualization",
	exclude: ["**/__tests__/**/*", "**/tests/**/*"],
	name: "Viewer - Attribute Visualization",
	hideGenerator: true,
	disableSources: true,
	theme: "default",
	excludeExternals: false,
	excludePrivate: true,
	sort: ["required-first", "kind", "alphabetical"],
};
