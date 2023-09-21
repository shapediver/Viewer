import { Camera, Scene } from "three"
import { AOPass } from "../ao/AOPass"
import { ssao as fragmentShader } from "./shader/ssao"

class SSAOPass extends AOPass {
	constructor(camera: Camera, scene: Scene) {
		super(camera, scene, fragmentShader)
	}
}

export { SSAOPass }
