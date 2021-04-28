import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { StringParameter as StringParameterLogic } from "@shapediver/viewer.session-engine.session-engine";

export class StringParameterDTO implements IParameter<string> {
    // #region Properties (11)

    readonly defval: string;
    readonly id: string;
    readonly max: number;
    readonly name: string;
    readonly type: PARAMETERTYPE;
    readonly visualization: PARAMETERVISUALIZATION.TEXT;

    displayName?: string;
    hidden: boolean;
    order?: number;
    value: string;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(p: StringParameterLogic) {
        this.defval = p.defval;
        this.id = p.id;
        this.max = p.max;
        this.name = p.name;
        this.type = p.type;
        this.visualization = p.visualization;
        this.hidden = p.hidden;
        this.displayName = p.displayName;
        this.order = p.order;
        this.value = p.value;
    }

    // #endregion Constructors (1)
}