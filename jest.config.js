/**
 * Collects the packages that have unit tests (`__tests__`). Each package keeps
 * its own `jest` field in package.json. Run `pnpm test:unit` from the root
 * after `pnpm build`: the tests import other workspace packages from `dist/`.
 */
module.exports = {
	projects: [
		"<rootDir>/features/interaction",
		"<rootDir>/rendering-engine/intersection-engine",
		"<rootDir>/shared/node-tree",
		"<rootDir>/shared/services",
		"<rootDir>/utils/settings",
	],
};
