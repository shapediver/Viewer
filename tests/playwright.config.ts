import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
	globalSetup: require.resolve("./globalSetup"),
	testDir: ".",
	testMatch: "**/*.test.ts",
	tsconfig: "./tsconfig.json",
	forbidOnly: !!process.env.CI,
	fullyParallel: true,
	workers: process.env.CI ? 2 : 4,
	retries: 1,
	reporter: [["html", {open: "never"}], ["list"]],
	timeout: process.env.CI ? 120_000 : 60_000,
	snapshotDir: "./snapshots",
	snapshotPathTemplate: "{snapshotDir}/{arg}{ext}",
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.01,
		},
	},
	use: {
		viewport: {width: 1280, height: 720},
		deviceScaleFactor: 1,
		trace: process.env.CI ? "retain-on-failure" : "off",
	},
	projects: [
		{
			name: "chromium",
			use: {...devices["Desktop Chrome"]},
		},
	],
});
