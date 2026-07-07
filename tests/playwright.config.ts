import {defineConfig, devices} from "@playwright/test";

function withTrailingSlash(url: string): string {
	return url.endsWith("/") ? url : `${url}/`;
}

function resolveViewerTestBaseUrl(): string {
	const explicit = process.env.VIEWER_TEST_BASE_URL?.trim();
	if (explicit) return withTrailingSlash(explicit);

	const target = (
		process.env.VIEWER_TEST_ENV ||
		process.env.GITHUB_ENVIRONMENT ||
		process.env.GITHUB_REF_NAME ||
		"production"
	)
		.trim()
		.toLowerCase();

	switch (target) {
		case "development":
			return withTrailingSlash("https://viewer.shapediver.com/v3/development");
		case "staging":
			return withTrailingSlash("https://viewer.shapediver.com/v3/staging");
		case "production":
		case "latest":
		case "main":
		default:
			return withTrailingSlash("https://viewer.shapediver.com/v3/latest");
	}
}

const viewerTestBaseUrl = resolveViewerTestBaseUrl();
const testTimeout = process.env.GITHUB_ACTIONS ? 180_000 : 120_000;
const expectTimeout = process.env.GITHUB_ACTIONS ? 60_000 : 30_000;

console.log(`[playwright] VIEWER_TEST_BASE_URL = ${viewerTestBaseUrl}`);

export default defineConfig({
	globalSetup: require.resolve("./globalSetup"),
	testDir: ".",
	testMatch: "**/*.test.ts",
	tsconfig: "./tsconfig.json",
	forbidOnly: !!process.env.CI,
	fullyParallel: true,
	workers: process.env.GITHUB_ACTIONS ? 1 : 2,
	retries: 1,
	reporter: [["html", {open: "never"}], ["list"]],
	timeout: testTimeout,
	snapshotDir: "./snapshots",
	snapshotPathTemplate: "{snapshotDir}/{arg}{ext}",
	expect: {
		timeout: expectTimeout,
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.01,
		},
	},
	use: {
		baseURL: viewerTestBaseUrl,
		viewport: {width: 1280, height: 720},
		deviceScaleFactor: 1,
		actionTimeout: 60_000,
		navigationTimeout: 60_000,
		trace: process.env.CI ? "retain-on-failure" : "off",
	},
	projects: [
		{
			name: "chromium",
			use: {...devices["Desktop Chrome"]},
		},
	],
});
