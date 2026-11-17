import {defineConfig} from "@playwright/test";
import path from "path";

/**
 * Work-count benchmark for two builds of examples/test-cdn. See README.md.
 * It reports numbers. It does not assert them.
 *
 * Counts do not depend on machine load, so this run takes no lock and may
 * run next to the timing benchmark. It uses its own ports.
 */

const repo = path.join(__dirname, "../../..");
const defaultDist = path.join(repo, "examples/test-cdn/dist");
const base = path.resolve(process.env.BENCH_BASE ?? defaultDist);
const head = path.resolve(process.env.BENCH_HEAD ?? defaultDist);
const serve = path.join(__dirname, "serve.mjs");
const basePort = Number(process.env.COUNT_BASE_PORT ?? 8197);
const headPort = Number(process.env.COUNT_HEAD_PORT ?? 8198);
process.env.COUNT_BASE_PORT = String(basePort);
process.env.COUNT_HEAD_PORT = String(headPort);

export default defineConfig({
	testDir: ".",
	testMatch: "**/*.count.ts",
	tsconfig: "../../tsconfig.json",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [["list"]],
	timeout: 60 * 60_000,
	use: {
		viewport: {width: 1280, height: 720},
		deviceScaleFactor: 1,
		channel: "chrome",
		launchOptions: {
			args: [
				"--use-angle=d3d11",
				"--ignore-gpu-blocklist",
				// Optimized code does not count calls it inlines, and when a
				// function gets optimized depends on timing. Without the
				// optimizing tiers every call is counted on every run.
				"--js-flags=--no-opt --no-maglev",
			],
		},
		trace: "off",
	},
	webServer: [
		{
			command: `node "${serve}" "${base}" ${basePort}`,
			port: basePort,
			reuseExistingServer: false,
			timeout: 30_000,
		},
		{
			command: `node "${serve}" "${head}" ${headPort}`,
			port: headPort,
			reuseExistingServer: false,
			timeout: 30_000,
		},
	],
});
