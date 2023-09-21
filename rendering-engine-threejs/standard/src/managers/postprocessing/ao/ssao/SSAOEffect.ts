import { EffectComposer } from "postprocessing"
import { AOEffect } from "../ao/AOEffect"
import { SSAOPass } from "./SSAOPass"
import { getPointsOnSphere } from "./utils/ssaoUtils"
import { Camera, Scene } from "three"

class SSAOEffect extends AOEffect {
	spp: number = 16;
	constructor(composer: EffectComposer, camera: Camera, scene: Scene, options?: any) {
		super(composer, camera, scene, new SSAOPass(camera, scene), options)

		SSAOEffect.DefaultOptions = {
			...AOEffect.DefaultOptions,
			...{
				spp: 16,
				distance: 1,
				distancePower: 0.25,
				power: 2
			}
		}

		options = {
			...SSAOEffect.DefaultOptions,
			...options
		}

	}

	makeOptionsReactive(options: { [key: string]: any }) {
		super.makeOptionsReactive(options)

		for (const key of ["spp"]) {
			Object.defineProperty(this, key, {
				get() {
					return options[key]
				},
				set(value) {
					if (value === null || value === undefined) return

					options[key] = value

					switch (key) {
						case "spp":
							this.aoPass.fullscreenMaterial.defines.spp = value.toFixed(0)

							const samples = getPointsOnSphere(value)

							const samplesR = []
							for (let i = 0; i < value; i++) {
								samplesR.push((i + 1) / value)
							}

							this.aoPass.fullscreenMaterial.uniforms.samples = { value: samples }
							this.aoPass.fullscreenMaterial.uniforms.samplesR = { value: samplesR }

							this.aoPass.fullscreenMaterial.needsUpdate = true
							break
					}
				},
				configurable: true
			})
		}

		this.spp = options["spp"]
	}
}

export { SSAOEffect }
