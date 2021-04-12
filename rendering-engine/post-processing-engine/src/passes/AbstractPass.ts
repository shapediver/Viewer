import { IPostProcessingPass, POSTPROCESSINGTYPE } from "../IPostProcessingPass";

export abstract class AbstractPass implements IPostProcessingPass {
    // #region Constructors (1)

    constructor(private readonly _type: POSTPROCESSINGTYPE) {}

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    /**
     * Getter type
     * @return {POSTPROCESSINGTYPE}
     */
    public get type(): POSTPROCESSINGTYPE {
		return this._type;
    }

    // #endregion Public Accessors (1)
}