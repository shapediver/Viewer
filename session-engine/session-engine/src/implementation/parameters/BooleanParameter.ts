import { ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v1";
import { PARAMETERTYPE, PARAMETERVISUALIZATION } from "../../interfaces/IParameter";
import { AbstractParameter } from "../AbstractParameter";
import { Session } from "../Session";

export class BooleanParameter extends AbstractParameter<boolean> {
    // #region Constructors (1)

    constructor(mySession: Session, id: string, parameterDefinition: ShapeDiverResponseParameter) {
        super(mySession, id, parameterDefinition, (parameterDefinition.defval === "true"));
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter type
     * @return {PARAMETERTYPE}
     */
    public get type(): PARAMETERTYPE.BOOL {
        return <PARAMETERTYPE.BOOL>this._type;
    }

    /**
     * Getter visualization
     * @return {PARAMETERVISUALIZATION}
     */
    public get visualization(): PARAMETERVISUALIZATION.TOGGLE {
        return <PARAMETERVISUALIZATION.TOGGLE>this._visualization;
    }

    // #endregion Public Accessors (2)

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