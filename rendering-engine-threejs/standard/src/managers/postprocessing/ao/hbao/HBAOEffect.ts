import { HBAOPass } from "./HBAOPass"
// eslint-disable-next-line camelcase
import { AOEffect } from "../ao/AOEffect"
import { EffectComposer } from "postprocessing"
import { Camera, Scene } from "three"

class HBAOEffect extends AOEffect {
	lastSize = { width: 0, height: 0, resolutionScale: 0 }

	constructor(composer: EffectComposer, camera: Camera, scene: Scene, options: any = AOEffect.DefaultOptions) {
		super(composer, camera, scene, new HBAOPass(camera, scene), {
			...AOEffect.DefaultOptions,
			...HBAOEffect.DefaultOptions,
			...options
		})
	}
}

export { HBAOEffect }
