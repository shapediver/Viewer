import { PARAMETERTYPE, PARAMETERVISUALIZATION } from "../../interfaces/IParameter";
import { ISessionParameter } from "../../interfaces/session/ISessionParameter";
import { AbstractParameter } from "../AbstractParameter";
import { Session } from "../Session";

export class StringListParameter extends AbstractParameter<string> {
    // #region Properties (1)

    private readonly _choices: string[];

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(mySession: Session, id: string, parameterDefinition: ISessionParameter) {
        super(mySession, id, parameterDefinition, parameterDefinition.defval);
        this._choices = parameterDefinition.choices!;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    /**
     * Getter choices
     * @return {string[]}
     */
    public get choices(): string[] {
        return this._choices;
    }

    /**
     * Getter type
     * @return {PARAMETERTYPE}
     */
    public get type(): PARAMETERTYPE.STRINGLIST {
        return <PARAMETERTYPE.STRINGLIST>this._type;
    }

    /**
     * Getter visualization
     * @return {PARAMETERVISUALIZATION}
     */
    public get visualization(): PARAMETERVISUALIZATION.CHECKLIST | PARAMETERVISUALIZATION.DROPDOWN | PARAMETERVISUALIZATION.CYCLE | PARAMETERVISUALIZATION.SEQUENCE {
        return <PARAMETERVISUALIZATION.CHECKLIST | PARAMETERVISUALIZATION.DROPDOWN | PARAMETERVISUALIZATION.CYCLE | PARAMETERVISUALIZATION.SEQUENCE>this._visualization;
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