import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { EvenParameter as EvenParameterLogic } from "@shapediver/viewer.session-engine.session-engine";

export class EvenParameterDTO implements IParameter<number> {
    // #region Properties (13)

    readonly defval: number;
    readonly id: string;
    readonly max: number;
    readonly min: number;
    readonly name: string;
    readonly note?: string;
    readonly type: PARAMETERTYPE;
    readonly visualization: PARAMETERVISUALIZATION.SLIDER;

    displayName?: string;
    hidden: boolean;
    order?: number;
    value: number;

    // #endregion Properties (13)

    // #region Constructors (1)

    constructor(p: EvenParameterLogic) {
        this.defval = p.defval;
        this.id = p.id;
        this.max = p.max;
        this.min = p.min;
        this.name = p.name;
        this.note = p.note;
        this.type = p.type;
        this.visualization = p.visualization;
        this.hidden = p.hidden;
        this.displayName = p.displayName;
        this.order = p.order;
        this.value = p.value;
    }

    // #endregion Constructors (1)
}