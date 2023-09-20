import { AOPass } from "../ao/AOPass"
import { ssao as fragmentShader } from "./shader/ssao"

class SSAOPass extends AOPass {
	constructor(camera, scene) {
		super(camera, scene, fragmentShader)
	}
}

export { SSAOPass }
