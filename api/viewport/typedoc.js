const externalSymbolLinkMappings = require("../../scripts/other/typedoc-external-symbol-links");

module.exports = {
	entryPoints: ["./src/index.ts"],
	out: "../../docs",
	exclude: ["**/__tests__/**/*", "**/tests/**/*"],
	name: "Viewer - Viewport API",
	hideGenerator: true,
	disableSources: true,
	theme: "default",
	excludeExternals: false,
	externalSymbolLinkMappings,
	excludePrivate: true,
	sort: ["required-first", "kind", "alphabetical"],
};
