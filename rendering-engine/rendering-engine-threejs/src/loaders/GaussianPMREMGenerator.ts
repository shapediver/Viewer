import * as THREE from "three";
import {
	IPMREMGeneratorInternals as IPreparedPMREMGeneratorInternals,
	ViewerPMREMGenerator,
} from "./ViewerPMREMGenerator";

/*
 * The prefiltering loop of the three.js r160 PMREMGenerator
 * (https://github.com/mrdoob/three.js/blob/r160/src/extras/PMREMGenerator.js),
 * three.js is MIT licensed, copyright 2010-2023 three.js authors.
 *
 * Only `_applyPMREM` and its blur axes are ported. The Gaussian blur itself
 * (`_blur`, `_halfBlur`, the blur shader and the per-level sigmas) is still part
 * of the current three.js PMREMGenerator and unchanged since r160, it is just no
 * longer used to fill the blurred levels.
 */

// Golden Ratio
const PHI = (1 + Math.sqrt(5)) / 2;
const INV_PHI = 1 / PHI;

// Vertices of a dodecahedron (except the opposites, which represent the
// same axis), used as axis directions evenly spread on a sphere.
const AXIS_DIRECTIONS = [
	new THREE.Vector3(1, 1, 1),
	new THREE.Vector3(-1, 1, 1),
	new THREE.Vector3(1, 1, -1),
	new THREE.Vector3(-1, 1, -1),
	new THREE.Vector3(0, PHI, INV_PHI),
	new THREE.Vector3(0, PHI, -INV_PHI),
	new THREE.Vector3(INV_PHI, 0, PHI),
	new THREE.Vector3(-INV_PHI, 0, PHI),
	new THREE.Vector3(PHI, INV_PHI, 0),
	new THREE.Vector3(-PHI, INV_PHI, 0),
];

/** The internals of THREE.PMREMGenerator that the r160 loop uses. */
interface IPMREMGeneratorInternals {
	_renderer: THREE.WebGLRenderer;
	_lodMeshes: unknown[];
	_sigmas: number[];
	_blur(
		cubeUVRenderTarget: THREE.WebGLRenderTarget,
		lodIn: number,
		lodOut: number,
		sigma: number,
		poleAxis?: THREE.Vector3,
	): void;
}

/**
 * A PMREM generator that fills the blurred levels of the environment map with
 * the Gaussian blur of three.js r160 and older, instead of the GGX importance
 * sampling of current three.js. The sharp level is the same in both.
 */
export class GaussianPMREMGenerator extends ViewerPMREMGenerator {
	/**
	 * Replaces the GGX filter loop of THREE.PMREMGenerator with the one of r160.
	 * Called by THREE.PMREMGenerator after the sharp level was written.
	 */
	public _applyPMREM(cubeUVRenderTarget: THREE.WebGLRenderTarget): void {
		const internals = this as unknown as IPMREMGeneratorInternals;
		const renderer = internals._renderer;
		const autoClear = renderer.autoClear;
		renderer.autoClear = false;

		const sigmas = internals._sigmas;
		for (let i = 1; i < internals._lodMeshes.length; i++) {
			const sigma = Math.sqrt(
				sigmas[i] * sigmas[i] - sigmas[i - 1] * sigmas[i - 1],
			);
			const poleAxis = AXIS_DIRECTIONS[(i - 1) % AXIS_DIRECTIONS.length];
			internals._blur(cubeUVRenderTarget, i - 1, i, sigma, poleAxis);
		}

		renderer.autoClear = autoClear;
	}

	/** The blurred levels are filled with the blur material, not the GGX one. */
	protected filterMaterial(
		internals: IPreparedPMREMGeneratorInternals,
	): THREE.ShaderMaterial | null {
		return internals._blurMaterial;
	}
}
