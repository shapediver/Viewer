import {expect, test, type Page} from "@playwright/test";
import {installApi} from "../exact/harness";
import {
	HDR,
	installEnvironmentMapProbe,
	serveEnvironmentAssets,
} from "../fixtures/environmentMap";
import {openViewer} from "../fixtures/probe";
import {compare, Counters, UPDATE, writeBaseline} from "./harness";

/**
 * Environment map loading (SS-10619). Where an .hdr file is decoded, how many
 * workers that takes, and how many programs a second map of the same size
 * links in the same viewport. None of it depends on the GPU, so the
 * SwiftShader CI job guards it too.
 */
async function collectEnvironmentMap(page: Page): Promise<Counters> {
	await serveEnvironmentAssets(page);
	await page.evaluate(installApi);
	await page.evaluate(() => (window as any).__perf.create());
	await page.evaluate(installEnvironmentMapProbe);
	return page.evaluate(
		async ({a, b}) => {
			const env = (window as any).__perf.env;
			const counters: Record<string, number> = {};
			const load = async (url: string, expectPixels: number) => {
				env.reset();
				const result = await env.load(url, expectPixels);
				if (result.status !== "end")
					throw new Error(`${url}: ${JSON.stringify(result)}`);
				return env.read();
			};

			const first = await load(a.url, a.width * a.height * 4);
			counters["envMap.hdrDecodesInWorker"] = first.hdrDecodesInWorker;
			counters["envMap.hdrDecodesOnMainThread"] =
				first.hdrDecodesOnMainThread;
			counters["envMap.workersCreated"] = first.workersCreated;

			const second = await load(b.url, b.width * b.height * 4);
			counters["envMap.secondLoad.programsLinked"] =
				second.programsLinked;
			counters["envMap.secondLoad.hdrDecodesInWorker"] =
				second.hdrDecodesInWorker;
			counters["envMap.secondLoad.workersCreated"] =
				second.workersCreated;
			return counters;
		},
		{a: HDR.a, b: HDR.b},
	);
}

test("budget: environment map", async ({page}) => {
	// the program links are polled with timers, so the clock is not faked
	await openViewer(page);
	const counters = await collectEnvironmentMap(page);
	if (UPDATE) {
		writeBaseline("environmentMap", counters);
		return;
	}
	expect(compare("environmentMap", counters).join("\n")).toBe("");
});
