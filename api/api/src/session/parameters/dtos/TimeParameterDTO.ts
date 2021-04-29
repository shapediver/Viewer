import { ShapeDiverResponseParameterGroup as ParameterGroup, ShapeDiverResponseParameterStructure as ParameterStructure } from "@shapediver/api.geometry-api-dto-v1";
import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { TimeParameter as TimeParameterLogic } from "@shapediver/viewer.session-engine.session-engine";

export class TimeParameterDTO implements IParameter<string> {
    // #region Properties (11)

    readonly defval: string;
    readonly id: string;
    readonly name: string;
    readonly type: PARAMETERTYPE;
    readonly visualization: PARAMETERVISUALIZATION.CLOCK | PARAMETERVISUALIZATION.CALENDAR;
    readonly group?: ParameterGroup;
    readonly structure?: ParameterStructure;
    readonly tooltip?: string;

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
        this.type = p.type;
        this.visualization = p.visualization;
        this.group = p.group;
        this.structure = p.structure;
        this.tooltip = p.tooltip;
        
        this.hidden = p.hidden;
        this.displayName = p.displayName;
        this.order = p.order;
        this.value = p.value;
    }

    // #endregion Constructors (1)
}