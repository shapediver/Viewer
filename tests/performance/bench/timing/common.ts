import type {CDPSession, Page} from "@playwright/test";
import {AEC_DEFAULT} from "../../fixtures/aecScene";
import type {SceneVariant} from "../../fixtures/probe";

/** BENCH_GLASS_BLEND=1: the glass is glTF BLEND (transparent, no depth write). */
export const SCENE = {
	...AEC_DEFAULT,
	glassBlend: process.env.BENCH_GLASS_BLEND === "1",
};
export const VARIANT: SceneVariant = {
	id: "default",
	shadows: true,
	ssao: false,
};

export type Clock = "cpu" | "wall";

export interface Viewer {
	page: Page;
	cdp: CDPSession;
	gpu: string;
}

/**
 * Waits until the viewer has drawn nothing for 10 frames, so a page that
 * finishes its beauty render does not run while another page is measured.
 */
export async function settle(viewer: Viewer) {
	await viewer.page.evaluate(async () => {
		const probe = (window as any).__probe;
		const frame = () =>
			new Promise((resolve) => requestAnimationFrame(resolve));
		const start = performance.now();
		let quiet = 0;
		let seen = probe.passes.length;
		while (quiet < 10 && performance.now() - start < 10_000) {
			await frame();
			if (probe.passes.length === seen) quiet++;
			else [quiet, seen] = [0, probe.passes.length];
		}
		probe.reset();
	});
}
