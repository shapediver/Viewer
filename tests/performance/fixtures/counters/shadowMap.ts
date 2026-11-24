/**
 * Shadow map renders. Runs in the page. Adds
 * `window.__probe.counters.shadowMap`.
 * It must not reference anything outside its own body.
 *
 * three.js draws the shadow maps inside `renderer.render`, through
 * `renderer.shadowMap.render`, not through a `renderer.render` call of their
 * own, so the passes of `probe.ts` do not see them. The viewer keeps
 * `autoUpdate` off and sets `needsUpdate` when the shadows have to be drawn
 * again.
 *
 * `read()` gives, since the last reset:
 * - `renders`: calls that drew the maps (enabled, `autoUpdate` or
 *   `needsUpdate`, at least one light), not the calls that returned early
 * - `lightPasses`: the lights those calls drew a map for
 */
export function installShadowMap() {
	const probe = (window as any).__probe;
	let renders = 0;
	let lightPasses = 0;
	let attached = false;

	function attach() {
		if (attached || !probe.renderer) return;
		const shadowMap = probe.renderer.shadowMap;
		const render = shadowMap.render;
		shadowMap.render = function (this: any, lights: any[], ...rest: any[]) {
			if (
				shadowMap.enabled &&
				(shadowMap.autoUpdate || shadowMap.needsUpdate) &&
				lights.length > 0
			) {
				renders++;
				// three.js skips a light whose shadow neither auto-updates
				// nor needs an update.
				lightPasses += lights.filter(
					(light) =>
						light.shadow &&
						(light.shadow.autoUpdate || light.shadow.needsUpdate),
				).length;
			}
			return render.call(this, lights, ...rest);
		};
		attached = true;
	}

	probe.counters.shadowMap = {
		attach,
		reset() {
			renders = 0;
			lightPasses = 0;
		},
		read: () => ({renders, lightPasses}),
	};
}
