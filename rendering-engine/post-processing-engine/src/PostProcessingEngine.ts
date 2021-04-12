import { IPostProcessingPass } from "./IPostProcessingPass";

export class PostProcessingEngine {
    private readonly _passes: IPostProcessingPass[] = [];

    public addPass(pass: IPostProcessingPass): boolean {
        this._passes.push(pass);
        return true;
    }
    
    public removePass(pass: IPostProcessingPass): boolean {
        if(this._passes.indexOf(pass) === -1) return false;
        this._passes.splice(this._passes.indexOf(pass), 1);
        return true;
    }
}