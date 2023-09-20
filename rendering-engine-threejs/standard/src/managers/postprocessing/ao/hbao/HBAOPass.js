import { AOPass } from "../ao/AOPass"
// eslint-disable-next-line camelcase
import {hbao_utils} from "./shader/hbao_utils"
import {fragmentShader} from "./shader/hbao"

const finalFragmentShader = fragmentShader.replace("#include <hbao_utils>", hbao_utils)

class HBAOPass extends AOPass {
	constructor(camera, scene) {
		super(camera, scene, finalFragmentShader)
	}
}

export { HBAOPass }
