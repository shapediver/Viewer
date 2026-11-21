import {expect, test, type Page} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {openViewer} from "../fixtures/probe";
import {syntheticGlb} from "../syntheticGlb";
import {
	compare,
	Counters,
	isSoftwareRenderer,
	UPDATE,
	writeBaseline,
} from "./harness";

const GLTF_ASSET_HOST = "https://budget-assets.viewertests.invalid";
// Shaped like ShapeDiverGltfV2Writer output, 4,000 nodes. The conversion has to
// be longer than one time slice for `plain.conversionYielded` to be 1; with
// 1,249 nodes it was about one slice and cheaper ids (SS-10491) ended it.
const GLTF_PLAIN = syntheticGlb({
	meshes: 1000,
	instancesPerMesh: 3,
	gridSize: 8,
	jitter: true,
});

/**
 * glTF loading (SS-10396). The AEC scene is built in the page and never
 * loads a file, so this scenario loads a plain glb and a Draco glTF through
 * `DataEngine.loadContent` and counts where the work happens.
 */
async function collectGltf(page: Page): Promise<Counters> {
	await page.route(`${GLTF_ASSET_HOST}/**`, async (route) => {
		const name = path.basename(new URL(route.request().url()).pathname);
		if (name === "plain.glb")
			return route.fulfill({
				status: 200,
				contentType: "model/gltf-binary",
				body: GLTF_PLAIN,
			});
		const file = path.join(__dirname, "../assets", name);
		if (!fs.existsSync(file)) return route.fulfill({status: 404});
		await route.fulfill({status: 200, body: fs.readFileSync(file)});
	});
	return page.evaluate(
		async ({host, bodyBytes}) => {
			const SDV = (window as any).SDV;
			// Workers and the requests posted to them.
			let workers = 0;
			let workerRequests = 0;
			const OriginalWorker = window.Worker;
			(window as any).Worker = function WorkerProxy(
				this: Worker,
				...args: ConstructorParameters<typeof Worker>
			) {
				workers++;
				const worker = new OriginalWorker(...args);
				const post = worker.postMessage.bind(worker);
				worker.postMessage = ((...message: any[]) => {
					workerRequests++;
					return (post as any)(...message);
				}) as Worker["postMessage"];
				return worker;
			};
			// Copies of a whole GLB body.
			let bodyCopies = 0;
			const slice = ArrayBuffer.prototype.slice;
			ArrayBuffer.prototype.slice = function (
				this: ArrayBuffer,
				...args: [number?, number?]
			) {
				const copy = slice.apply(this, args);
				if (copy.byteLength >= bodyBytes) bodyCopies++;
				return copy;
			};
			// Animation frames while the loader converts nodes: from its
			// "initial logic" event to its end event. 0 means the conversion
			// was one task. (scheduler.yield resumes ahead of queued tasks, so a
			// posted message is not a probe; the frames are what it lets through.)
			let converting = false;
			let framesWhileConverting = 0;
			SDV.addListener(SDV.EVENTTYPE.TASK.TASK_PROCESS, (event: any) => {
				if (
					event.type === SDV.TASK_TYPE.GLTF_CONTENT_LOADING &&
					event.progress === 0.1
				)
					converting = true;
			});
			SDV.addListener(SDV.EVENTTYPE.TASK.TASK_END, (event: any) => {
				if (event.type === SDV.TASK_TYPE.GLTF_CONTENT_LOADING)
					converting = false;
			});
			let counting = true;
			const frame = () => {
				if (converting) framesWhileConverting++;
				if (counting) requestAnimationFrame(frame);
			};
			requestAnimationFrame(frame);

			const counters: Record<string, number> = {};
			const load = (format: string, name: string) =>
				SDV.DataEngine.instance.loadContent({
					format,
					href: `${host}/${name}`,
				});

			await load("glb", "plain.glb");
			counters["plain.workersCreated"] = workers;
			counters["plain.bodyCopies"] = bodyCopies;
			counters["plain.conversionYielded"] = Math.min(
				1,
				framesWhileConverting,
			);

			// Box.gltf has one Draco primitive.
			await load("gltf", "Box.gltf");
			counters["draco.workersCreated"] = workers;
			counters["draco.decodesInWorker"] = workerRequests;
			counters["draco.decodesOnMainThread"] = 1 - workerRequests;
			await load("gltf", "Box.gltf");
			counters["draco.secondLoad.workersCreated"] = workers;
			counters["draco.secondLoad.decodesInWorker"] = workerRequests;

			counting = false;
			ArrayBuffer.prototype.slice = slice;
			(window as any).Worker = OriginalWorker;
			return counters;
		},
		{host: GLTF_ASSET_HOST, bodyBytes: GLTF_PLAIN.length / 2},
	);
}

test("budget: AEC facade, gltf", async ({page}) => {
	// gltf renders nothing and measures how the loader slices its work in
	// time, which a faked clock would stop.
	await openViewer(page);
	if (await isSoftwareRenderer(page)) test.setTimeout(900_000);

	const counters = await collectGltf(page);
	if (UPDATE) {
		writeBaseline("gltf", counters);
		return;
	}
	expect(compare("gltf", counters).join("\n")).toBe("");
});
