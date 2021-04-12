import { POSTPROCESSINGTYPE } from "../IPostProcessingPass";
import { AbstractPass } from "./AbstractPass";

export class SSAAPass extends AbstractPass {
    constructor() {
        super(POSTPROCESSINGTYPE.SSAA);
    }
}