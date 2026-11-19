import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const shelfTicket = sdeuc1.models["Shelf"].ticket;

// The tests use no external host. This made-up host cannot be reached by the
// Geometry Backend proxy, so the viewer falls back to the direct download,
// which the tests answer themselves.
const ASSET_HOST = "https://envmap-assets.viewertests.invalid";
// A custom .hdr on a host that allows cross-origin reads.
const CUSTOM_HDR = `${ASSET_HOST}/studio_4x2.hdr`;
// Same host, file does not exist: the proxy and the direct download both fail.
const MISSING_HDR = `${ASSET_HOST}/does_not_exist.hdr`;

/**
 * A minimal Radiance .hdr file: 4 x 2 pixels, not run-length encoded, every
 * pixel white with value 1 (RGBE 128, 128, 128, 129).
 */
const createHdrFile = (): Buffer => {
	const width = 4;
	const height = 2;
	const header = Buffer.from(
		`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`,
		"ascii",
	);
	const pixels = Buffer.alloc(width * height * 4);
	for (let i = 0; i < width * height; i++)
		pixels.set([128, 128, 128, 129], i * 4);
	return Buffer.concat([header, pixels]);
};

/** Answers the direct downloads from the made-up asset host. */
const serveAssets = async (page: import("@playwright/test").Page) =>
	page.route(`${ASSET_HOST}/**`, (route) =>
		route.request().url() === CUSTOM_HDR
			? route.fulfill({
					status: 200,
					contentType: "image/vnd.radiance",
					headers: {"access-control-allow-origin": "*"},
					body: createHdrFile(),
				})
			: route.fulfill({
					status: 404,
					headers: {"access-control-allow-origin": "*"},
				}),
	);

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
		await serveAssets(page);
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
