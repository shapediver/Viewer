import {settle, VARIANT, type Viewer} from "./context";

/**
 * What the pick sections share: the facade with interaction data on every
 * glass pane and a hover manager, and the screen points of one pane that the
 * pointer hits and of one place it misses. The pick itself is
 * `window.__pickEngine.onPointerMove(event)`, called without a mouse so that
 * a section counts it and nothing else. The scene is left with the pointer
 * on the miss point and no hover.
 */
export async function setupPick(viewer: Viewer) {
	await viewer.page.evaluate(
		(variant) => (window as any).__probe.show(variant),
		VARIANT,
	);
	await viewer.page.evaluate(() => {
		const probe = (window as any).__probe;
		const SDV = (window as any).SDV;
		const {InteractionEngine, HoverManager, InteractionData} = (
			window as any
		).SDVInteractions;
		for (const item of probe.aec.glassItems)
			item.addData(new InteractionData({hover: true}));
		const engine = new InteractionEngine(probe.viewport);
		const hover = new HoverManager();
		hover.effectMaterial = new SDV.MaterialStandardData({
			color: "#dddddd",
		});
		engine.addInteractionManager(hover);
		(window as any).__pickEngine = engine;
		(window as any).__pickEvent = (x: number, y: number) =>
			new PointerEvent("pointermove", {
				clientX: x,
				clientY: y,
				pointerId: 1,
				buttons: 0,
			});
		probe.viewport.update();
	});
	await settle(viewer);
	const points = await viewer.page.evaluate(() => {
		const probe = (window as any).__probe;
		const SDV = (window as any).SDV;
		const engine = (window as any).__pickEngine;
		const event = (window as any).__pickEvent;
		let hoverOn = 0;
		SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_ON, () => hoverOn++);
		const box = probe.canvasRect();
		const miss: [number, number] = [box.x + 2, box.y + 2];
		engine.onPointerMove(event(...miss));
		let hit: [number, number] | null = null;
		for (let row = 1; row <= 10 && !hit; row++)
			for (let column = 1; column <= 12 && !hit; column++) {
				const x = box.x + (box.width * column) / 13;
				const y = box.y + (box.height * row) / 11;
				const before = hoverOn;
				engine.onPointerMove(event(x, y));
				if (hoverOn > before) hit = [x, y];
			}
		engine.onPointerMove(event(...miss));
		return {hit, miss};
	});
	if (!points.hit) throw new Error("no pane was hit by the hover scan");
	await settle(viewer);
	await viewer.page.evaluate((p) => {
		(window as any).__pickPoints = p;
	}, points);
}
