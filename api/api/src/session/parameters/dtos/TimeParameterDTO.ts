import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { TimeParameter as TimeParameterLogic } from "@shapediver/viewer.session-engine.session-engine";

export class TimeParameterDTO implements IParameter<string> {
    // #region Properties (11)

    readonly defval: string;
    readonly id: string;
    readonly name: string;
    readonly note?: string;
    readonly type: PARAMETERTYPE;
    readonly visualization: PARAMETERVISUALIZATION.CLOCK | PARAMETERVISUALIZATION.CALENDAR;

    displayName?: string;
    hidden: boolean;
    order?: number;
    value: string;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(p: TimeParameterLogic) {
        this.defval = p.defval;
        this.id = p.id;
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