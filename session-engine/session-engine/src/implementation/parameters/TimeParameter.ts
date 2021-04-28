import { ISessionParameter } from "@shapediver/viewer.shared.types";
import { PARAMETERTYPE, PARAMETERVISUALIZATION } from "../../interfaces/IParameter";
import { AbstractParameter } from "../AbstractParameter";
import { Session } from "../Session";

export class TimeParameter extends AbstractParameter<string> {
    // #region Constructors (1)

    constructor(mySession: Session, id: string, parameterDefinition: ISessionParameter) {
        super(mySession, id, parameterDefinition, parameterDefinition.defval);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter type
     * @return {PARAMETERTYPE}
     */
    public get type(): PARAMETERTYPE.TIME {
        return <PARAMETERTYPE.TIME>this._type;
    }

    /**
     * Getter visualization
     * @return {PARAMETERVISUALIZATION}
     */
    public get visualization(): PARAMETERVISUALIZATION.CLOCK | PARAMETERVISUALIZATION.CALENDAR {
        return <PARAMETERVISUALIZATION.CLOCK | PARAMETERVISUALIZATION.CALENDAR>this._visualization;
    }

    // #endregion Public Accessors (2)

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