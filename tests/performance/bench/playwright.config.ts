import {defineConfig} from "@playwright/test";
import path from "path";
import {acquireBenchLock} from "./lock";

/**
 * Timing benchmark for two builds of examples/test-cdn. See README.md.
 * It reports numbers. It does not assert them.
 */

// Playwright starts the web servers before any global setup, so the lock is
// taken here. Workers load this file too; only the runner takes the lock.
if (process.env.TEST_WORKER_INDEX === undefined) acquireBenchLock();

const repo = path.join(__dirname, "../../..");
const defaultDist = path.join(repo, "examples/test-cdn/dist");
const base = path.resolve(process.env.BENCH_BASE ?? defaultDist);
const head = path.resolve(process.env.BENCH_HEAD ?? defaultDist);
const serve = path.join(__dirname, "serve.mjs");

// timing.bench.ts expects base on 8195 and head on 8196.
export default defineConfig({
	testDir: ".",
	testMatch: "**/*.bench.ts",
	tsconfig: "../../tsconfig.json",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [["list"]],
	timeout: 30 * 60_000,
	use: {
		viewport: {width: 1280, height: 720},
		deviceScaleFactor: 1,
		channel: "chrome",
		launchOptions: {
			args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"],
		},
		trace: "off",
	},
	webServer: [
		{
			command: `node "${serve}" "${base}" 8195`,
			port: 8195,
			reuseExistingServer: false,
			timeout: 30_000,
		},
		{
			command: `node "${serve}" "${head}" 8196`,
			port: 8196,
			reuseExistingServer: false,
			timeout: 30_000,
		},
	],
});
