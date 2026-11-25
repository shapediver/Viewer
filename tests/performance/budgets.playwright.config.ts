import {defineConfig} from "@playwright/test";
import path from "path";
import base from "./playwright.config";

/**
 * Same as playwright.config.ts, for the budget tests only, on a port of
 * their own. The shared config always uses 8099, so two sessions or two
 * checkouts running performance tests at once can read each other's build.
 * Set BUDGET_PORT and BUDGET_DIST to pick another port or build.
 */
const port = Number(process.env.BUDGET_PORT ?? 8191);
const dist = path.resolve(
	process.env.BUDGET_DIST ??
		path.join(__dirname, "../../examples/test-cdn/dist"),
);

export default defineConfig({
	...base,
	testMatch: "budgets/**/*.perf.ts",
	// The base config leaves out the leak test; this config runs it.
	testIgnore: [],
	use: {...base.use, baseURL: `http://127.0.0.1:${port}/`},
	webServer: {
		command: `node "${path.join(__dirname, "bench/serve.mjs")}" "${dist}" ${port}`,
		port,
		reuseExistingServer: false,
		timeout: 30_000,
	},
});
