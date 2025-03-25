import {EffectComposer} from "postprocessing";
import {Camera, Scene, Vector3} from "three";
import {AOEffect} from "../ao/AOEffect";
import {AOPass} from "../ao/AOPass";
import {ao_utils} from "../ao/shader/ao_utils";
import {ssao as fragmentShader} from "./shader/ssao";

const finalFragmentShader = fragmentShader.replace(
	"#include <ao_utils>",
	ao_utils,
);

class SSAOPass extends AOPass {
	// #region Constructors (1)

	constructor(camera: Camera, scene: Scene) {
		super(camera, scene, finalFragmentShader);
	}

	// #endregion Constructors (1)
}

class SSAOEffect extends AOEffect {
	// #region Properties (1)

	public spp = 16;

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(
		composer: EffectComposer,
		camera: Camera,
		scene: Scene,
		options?: {[key: string]: unknown},
	) {
		super(composer, camera, scene, new SSAOPass(camera, scene), options);

		SSAOEffect.DefaultOptions = {
			...AOEffect.DefaultOptions,
			...{
				spp: 16,
				distance: 1,
				distancePower: 0.25,
				power: 2,
			},
		};

		options = {
			...SSAOEffect.DefaultOptions,
			...options,
		};
	}

	// #endregion Constructors (1)

	// #region Public Methods (2)

	public getPointsOnSphere(n: number) {
		const points = [];
		const inc = Math.PI * (3 - Math.sqrt(5));
		const off = 2 / n;

		for (let k = 0; k < n; k++) {
			const y = k * off - 1 + off / 2;
			const r = Math.sqrt(1 - y * y);
			const phi = k * inc;
			points.push(new Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r));
		}

		return points;
	}

	public makeOptionsReactive(options: {[key: string]: unknown}) {
		super.makeOptionsReactive(options);

		for (const key of ["spp"]) {
			Object.defineProperty(this, key, {
				get() {
					return options[key];
				},
				set(value) {
					if (value === null || value === undefined) return;

					options[key] = value;

					switch (key) {
						case "spp": {
							this.aoPass.fullscreenMaterial.defines.spp =
								value.toFixed(0);

							const samples = this.getPointsOnSphere(value);

							const samplesR = [];
							for (let i = 0; i < value; i++) {
								samplesR.push((i + 1) / value);
							}

							this.aoPass.fullscreenMaterial.uniforms.samples = {
								value: samples,
							};
							this.aoPass.fullscreenMaterial.uniforms.samplesR = {
								value: samplesR,
							};

							this.aoPass.fullscreenMaterial.needsUpdate = true;
							break;
						}
					}
				},
				configurable: true,
			});
		}

		this.spp = options["spp"] as number;
	}

	// #endregion Public Methods (2)
}

export {SSAOEffect};
