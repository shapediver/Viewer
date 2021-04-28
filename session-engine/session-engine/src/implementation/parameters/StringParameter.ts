import { ISessionParameter } from "@shapediver/viewer.shared.types";
import { PARAMETERTYPE, PARAMETERVISUALIZATION } from "../../interfaces/IParameter";
import { AbstractParameter } from "../AbstractParameter";
import { Session } from "../Session";

export class StringParameter extends AbstractParameter<string> {
    // #region Properties (1)

    private readonly _max: number;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(mySession: Session, id: string, parameterDefinition: ISessionParameter) {
        super(mySession, id, parameterDefinition, parameterDefinition.defval);
        this._max = +parameterDefinition.max!;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    /**
     * Getter max
     * @return {number}
     */
    public get max(): number {
        return this._max;
    }

    /**
     * Getter type
     * @return {PARAMETERTYPE}
     */
    public get type(): PARAMETERTYPE.STRING {
        return <PARAMETERTYPE.STRING>this._type;
    }

    /**
     * Getter visualization
     * @return {PARAMETERVISUALIZATION}
     */
    public get visualization(): PARAMETERVISUALIZATION.TEXT {
        return <PARAMETERVISUALIZATION.TEXT>this._visualization;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (1)

    /**
     * Convert the current value to string
     * @return {string}
     */
    public toString(): string {
        return this._value;
    }

    // #endregion Public Methods (1)
}