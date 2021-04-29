import { ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v1";
import { PARAMETERTYPE, PARAMETERVISUALIZATION } from "../..";
import { AbstractParameter } from "../AbstractParameter";
import { Session } from "../Session";

export class SCurveParameter extends AbstractParameter<string> {
    // #region Properties (3)

    private readonly _hint: string;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(mySession: Session, id: string, parameterDefinition: ShapeDiverResponseParameter) {
        super(mySession, id, parameterDefinition, parameterDefinition.defval);
        this._hint = 'hint' in parameterDefinition ? (<any>parameterDefinition).hint : '';
    }

    // #endregion Constructors (1)

    // #region Public Accessors (5)

    /**
     * Getter hint
     * @return {string}
     */
    public get hint(): string {
        return this._hint;
    }

    /**
     * Getter type
     * @return {PARAMETERTYPE}
     */
    public get type(): PARAMETERTYPE.SCURVE {
        return <PARAMETERTYPE.SCURVE>this._type;
    }

    /**
     * Getter visualization
     * @return {PARAMETERVISUALIZATION}
     */
    public get visualization(): PARAMETERVISUALIZATION.BUTTON {
        return <PARAMETERVISUALIZATION.BUTTON>this._visualization;
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