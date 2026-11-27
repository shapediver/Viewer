import {defineConfig} from "@playwright/test";

/**
 * Node-only unit tests run by the Playwright runner. They import source files
 * and workspace packages (resolved to `dist/`), so build those first:
 * `npx lerna run build --scope @shapediver/viewer.rendering-engine.rendering-engine-threejs --include-dependencies`.
 * No browser, no deployed viewer. `pnpm test` (tests/playwright.config.ts)
 * does not load this folder.
 */
export default defineConfig({
	testDir: ".",
	testMatch: "**/*.test.ts",
	tsconfig: "../tsconfig.json",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: [["list"]],
	timeout: 30_000,
});
