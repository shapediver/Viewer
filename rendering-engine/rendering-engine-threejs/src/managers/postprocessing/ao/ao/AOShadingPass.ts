import {Pass} from "postprocessing";
import {Color, Texture, WebGLRenderer} from "three";
import {AOEffect} from "./AOEffect";

/**
 * The uniforms the materials read the ambient occlusion from.
 * They are owned by the material loader.
 */
export interface IScreenAOUniforms {
	sdvScreenAOMap: {value: Texture | null};
	sdvScreenAOPower: {value: number};
	sdvScreenAOColor: {value: Color};
}

/**
 * A pass that computes the ambient occlusion before the scene is rendered
 * and hands the result to the materials. The materials then darken only
 * their indirect light with it, instead of the AO darkening the final image.
 *
 * The AO is computed from its own normal and depth pass, so it does not
 * depend on the color buffer of the render pass.
 */
export class AOShadingPass extends Pass {
	constructor(
		private readonly _effect: AOEffect,
		private readonly _uniforms: IScreenAOUniforms,
	) {
		super("AOShadingPass");
		this.needsSwap = false;
	}

	render(renderer: WebGLRenderer) {
		// renders the normals, the AO and the denoise, and selects the texture
		this._effect.update(renderer);

		this._uniforms.sdvScreenAOMap.value =
			this._effect.uniforms.get("inputTexture")!.value;
		this._uniforms.sdvScreenAOPower.value =
			this._effect.uniforms.get("power")!.value;
		this._uniforms.sdvScreenAOColor.value.copy(
			this._effect.uniforms.get("color")!.value,
		);
	}

	setSize(width: number, height: number) {
		this._effect.setSize(width, height);
	}
}
