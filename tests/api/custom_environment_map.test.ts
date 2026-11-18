import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const shelfTicket = sdeuc1.models["Shelf"].ticket;

// A custom .hdr on a host that allows cross-origin reads (pinned, immutable release).
const CUSTOM_HDR =
	"https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/equirectangular/royal_esplanade_1k.hdr";
// Same host, file does not exist: the Geometry Backend proxy and the direct download both fail.
const MISSING_HDR =
	"https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/equirectangular/does_not_exist_1k.hdr";

/**
 * Creates a viewport and a session with default settings, sets the environment map
 * and resolves with the status of the environment map task and the session errors.
 */
const loadEnvironmentMap = async (
	page: import("@playwright/test").Page,
	url: string,
) =>
	page.evaluate(
		async ({ticket, url}) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});

			const sessionErrors: string[] = [];
			SDV.addListener(SDV.EVENTTYPE.SESSION.SESSION_ERROR, (e: any) =>
				sessionErrors.push(String(e.error?.message)),
			);

			const status = await new Promise<string>((resolve) => {
				let taskId: string | undefined;
				SDV.addListener(SDV.EVENTTYPE.TASK.TASK_START, (e: any) => {
					if (
						e.type === "environment_map_loading" &&
						e.data?.input === url
					)
						taskId = e.id;
				});
				const done = (e: any) => {
					if (e.id === taskId) resolve(e.status);
				};
				SDV.addListener(SDV.EVENTTYPE.TASK.TASK_END, done);
				SDV.addListener(SDV.EVENTTYPE.TASK.TASK_CANCEL, done);
				viewport.environmentMap = url;
				setTimeout(() => resolve("timeout"), 30000);
			});
			// let the error logging of the failed load happen
			await new Promise((r) => setTimeout(r, 500));
			return {status, sessionErrors};
		},
		{ticket: shelfTicket, url},
	);

test.describe("Custom environment map", () => {
	test.beforeEach(async ({page}) => {
		await page.goto("test-cdn/index.html");
	});

	test("loads a custom .hdr URL with default session settings", async ({
		page,
	}) => {
		const result = await loadEnvironmentMap(page, CUSTOM_HDR);
		expect(result.status).toBe("Loaded EnvironmentMap");
		expect(result.sessionErrors).toEqual([]);
	});

	test("reports URL and status when a custom .hdr URL fails", async ({
		page,
	}) => {
		const errors: string[] = [];
		page.on("console", (message) => {
			if (message.type() === "error") errors.push(message.text());
		});

		const result = await loadEnvironmentMap(page, MISSING_HDR);

		expect(result.status).toBe("Loading of EnvironmentMap failed");
		// the proxy failure is retried with a direct download, so it is no session error
		expect(result.sessionErrors).toEqual([]);
		const loaderError = errors.find((e) =>
			e.includes("Was not able to load environment map"),
		);
		expect(loaderError).toContain(MISSING_HDR);
		expect(loaderError).toContain("HTTP 404");
	});
});
