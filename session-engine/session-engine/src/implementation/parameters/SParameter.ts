import { ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v1";
import { PARAMETERTYPE, PARAMETERVISUALIZATION } from "../..";
import { AbstractParameter } from "../AbstractParameter";
import { Session } from "../Session";

export class SParameter extends AbstractParameter<string> {

    // #region Constructors (1)

    constructor(mySession: Session, id: string, parameterDefinition: ShapeDiverResponseParameter) {
        super(mySession, id, parameterDefinition, parameterDefinition.defval);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (5)

    /**
     * Getter type
     * @return {PARAMETERTYPE}
     */
    public get type(): PARAMETERTYPE {
        return this._type;
    }

    /**
     * Getter visualization
     * @return {PARAMETERVISUALIZATION}
     */
    public get visualization(): PARAMETERVISUALIZATION {
        return this._visualization;
    }

    // #endregion Public Accessors (5)

    // #region Public Methods (1)

    /**
     * Convert the current value to string
     * @return {string}
     */
    public toString(): string {
        return this._value + '';
    }

    // #endregion Public Methods (1)
}