import {defineConfig} from "@playwright/test";
import path from "path";

/**
 * Opt-in performance suite. `pnpm test` does not load this config.
 * Serve the local test-cdn build. Do not point it at the hosted viewer.
 */
export default defineConfig({
	testDir: ".",
	testMatch: "**/*.perf.ts",
	tsconfig: "../tsconfig.json",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [["list"]],
	timeout: 120_000,
	use: {
		baseURL: "http://127.0.0.1:8099/",
		viewport: {width: 1280, height: 720},
		deviceScaleFactor: 1,
		channel: "chrome",
		launchOptions: {
			args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"],
		},
		actionTimeout: 30_000,
		navigationTimeout: 60_000,
		trace: "off",
	},
	webServer: {
		command: "node tests/performance/static-server.mjs",
		cwd: path.join(__dirname, "../.."),
		port: 8099,
		reuseExistingServer: false,
		timeout: 30_000,
	},
});
