const externalSymbolLinkMappings = require("../../scripts/other/typedoc-external-symbol-links");

module.exports = {
	entryPoints: ["./src/index.ts"],
	out: "../../docs/features/interaction",
	exclude: ["**/__tests__/**/*", "**/tests/**/*"],
	name: "Viewer - Interaction",
	hideGenerator: true,
	disableSources: true,
	theme: "default",
	excludeExternals: false,
	externalSymbolLinkMappings,
	excludePrivate: true,
	validation: {
		notExported: true,
	},
	sort: ["required-first", "kind", "alphabetical"],
};
