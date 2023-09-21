import { AOPass } from "../ao/AOPass"
// eslint-disable-next-line camelcase
import {hbao_utils} from "./shader/hbao_utils"
import {hbao as fragmentShader} from "./shader/hbao"
import { Camera, Scene } from "three"

const finalFragmentShader = fragmentShader.replace("#include <hbao_utils>", hbao_utils)

class HBAOPass extends AOPass {
	constructor(camera: Camera, scene: Scene) {
		super(camera, scene, finalFragmentShader)
	}
}

export { HBAOPass }
