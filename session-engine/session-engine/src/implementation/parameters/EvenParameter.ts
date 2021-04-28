import { PARAMETERTYPE, PARAMETERVISUALIZATION } from "../../interfaces/IParameter";
import { ISessionParameter } from "../../interfaces/session/ISessionParameter";
import { AbstractParameter } from "../AbstractParameter";
import { Session } from "../Session";

export class EvenParameter extends AbstractParameter<number> {
    // #region Properties (2)

    private readonly _max: number;
    private readonly _min: number;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(mySession: Session, id: string, parameterDefinition: ISessionParameter) {
        super(mySession, id, parameterDefinition, +parameterDefinition.defval);
        this._max = +parameterDefinition.max!;
        this._min = +parameterDefinition.min!;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (4)

    /**
     * Getter max
     * @return {number}
     */
    public get max(): number {
        return this._max;
    }

    /**
     * Getter min
     * @return {number}
     */
    public get min(): number {
        return this._min;
    }

    /**
     * Getter type
     * @return {PARAMETERTYPE}
     */
    public get type(): PARAMETERTYPE.EVEN {
        return <PARAMETERTYPE.EVEN>this._type;
    }

    /**
     * Getter visualization
     * @return {PARAMETERVISUALIZATION}
     */
    public get visualization(): PARAMETERVISUALIZATION.SLIDER {
        return <PARAMETERVISUALIZATION.SLIDER>this._visualization;
    }

    // #endregion Public Accessors (4)

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