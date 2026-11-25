import {expect, test} from "@playwright/test";
import * as THREE from "three";
import {GaussianPMREMGenerator} from "../../rendering-engine/rendering-engine-threejs/src/loaders/GaussianPMREMGenerator";

type BlurCall = {lodIn: number; lodOut: number; sigma: number; axis: number[]};

/** Runs the prefiltering loop with recorded blur calls instead of a renderer. */
function runApplyPMREM(sigmas: number[]) {
	const renderer = {autoClear: true};
	const generator = new GaussianPMREMGenerator(renderer as any);
	const internals = generator as any;
	const calls: BlurCall[] = [];
	internals._lodMeshes = sigmas.map(() => ({}));
	internals._sigmas = sigmas;
	internals._blur = (
		_target: unknown,
		lodIn: number,
		lodOut: number,
		sigma: number,
		poleAxis: THREE.Vector3,
	) => {
		// autoClear is off while the levels are blurred
		expect(renderer.autoClear).toBe(false);
		calls.push({lodIn, lodOut, sigma, axis: poleAxis.toArray()});
	};
	internals._applyPMREM({});
	return {calls, renderer};
}

test("every level is blurred from the previous one with the r160 sigma", () => {
	const sigmas = [0, 0.1, 0.25, 0.4];
	const {calls, renderer} = runApplyPMREM(sigmas);

	expect(calls.map((c) => [c.lodIn, c.lodOut])).toEqual([
		[0, 1],
		[1, 2],
		[2, 3],
	]);
	calls.forEach((c, i) =>
		expect(c.sigma).toBeCloseTo(
			Math.sqrt(sigmas[i + 1] ** 2 - sigmas[i] ** 2),
			12,
		),
	);
	expect(renderer.autoClear).toBe(true);
});

test("the blur axes are the dodecahedron axes of r160, repeated", () => {
	const phi = (1 + Math.sqrt(5)) / 2;
	const {calls} = runApplyPMREM(new Array(13).fill(0));

	expect(calls[0].axis).toEqual([1, 1, 1]);
	expect(calls[4].axis).toEqual([0, phi, 1 / phi]);
	expect(calls[9].axis).toEqual([-phi, 1 / phi, 0]);
	// the eleventh level starts over with the first axis
	expect(calls[10].axis).toEqual([1, 1, 1]);
});

test("three.js still has the blur the r160 loop uses", () => {
	// the Gaussian blur itself is three.js code: fail loudly if an update removes it
	const proto = THREE.PMREMGenerator.prototype as any;
	expect(typeof proto._blur).toBe("function");
	expect(typeof proto._halfBlur).toBe("function");
	expect(typeof proto._applyPMREM).toBe("function");
});
