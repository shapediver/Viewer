import { ISessionParameter } from "@shapediver/viewer.shared.types";
import { PARAMETERTYPE, PARAMETERVISUALIZATION } from "../../interfaces/IParameter";
import { AbstractParameter } from "../AbstractParameter";
import { Session } from "../Session";

export class FloatParameter extends AbstractParameter<number> {
    // #region Properties (3)

    private readonly _decimalplaces: number;
    private readonly _max: number;
    private readonly _min: number;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(mySession: Session, id: string, parameterDefinition: ISessionParameter) {
        super(mySession, id, parameterDefinition, +parameterDefinition.defval);
        this._max = +parameterDefinition.max!;
        this._min = +parameterDefinition.min!;
        this._decimalplaces = +parameterDefinition.decimalplaces!;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (5)

    /**
     * Getter decimalplaces
     * @return {number}
     */
    public get decimalplaces(): number {
        return this._decimalplaces;
    }

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
    public get type(): PARAMETERTYPE.FLOAT {
        return <PARAMETERTYPE.FLOAT>this._type;
    }

    /**
     * Getter visualization
     * @return {PARAMETERVISUALIZATION}
     */
    public get visualization(): PARAMETERVISUALIZATION.DIAL | PARAMETERVISUALIZATION.SLIDER {
        return <PARAMETERVISUALIZATION.DIAL | PARAMETERVISUALIZATION.SLIDER>this._visualization;
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