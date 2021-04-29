import { ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v1";
import { PARAMETERTYPE, PARAMETERVISUALIZATION } from "../..";
import { AbstractParameter } from "../AbstractParameter";
import { Session } from "../Session";

export class SBitmapParameter extends AbstractParameter<string | File | Blob> {
    // #region Properties (3)

    private readonly _max: number;
    private readonly _format: string[];

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(mySession: Session, id: string, parameterDefinition: ShapeDiverResponseParameter) {
        super(mySession, id, parameterDefinition, parameterDefinition.defval);
        this._format = parameterDefinition.format!;
        this._max = +parameterDefinition.max!;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (5)


    /**
     * Getter format
     * @return {string[]}
     */
    public get format(): string[] {
        return this._format;
    }

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
    public get type(): PARAMETERTYPE.SBITMAP {
        return <PARAMETERTYPE.SBITMAP>this._type;
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