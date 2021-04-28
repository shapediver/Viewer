import { ISessionParameter } from "@shapediver/viewer.shared.types";
import { PARAMETERTYPE, PARAMETERVISUALIZATION } from "../../interfaces/IParameter";
import { AbstractParameter } from "../AbstractParameter";
import { Session } from "../Session";

export class ColorParameter extends AbstractParameter<string> {
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
    public get type(): PARAMETERTYPE.COLOR {
        return <PARAMETERTYPE.COLOR>this._type;
    }

    /**
     * Getter visualization
     * @return {PARAMETERVISUALIZATION}
     */
    public get visualization(): PARAMETERVISUALIZATION.SWATCH {
        return <PARAMETERVISUALIZATION.SWATCH>this._visualization;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    /**
     * Convert the current value to string
     * @return {string}
     */
    public toString(): string {
        return this._value.replace('#', '0x') + (this._value.length >= 9 ? '' : 'ff');
    }

    // #endregion Public Methods (1)
}