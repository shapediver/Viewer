import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { IntParameter as IntParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { ShapeDiverResponseParameterGroup as ParameterGroup, ShapeDiverResponseParameterStructure as ParameterStructure } from "@shapediver/api.geometry-api-dto-v1";

export class IntParameterDTO implements IParameter<number | string> {
    // #region Properties (13)

    readonly defval: number;
    readonly id: string;
    readonly max: number;
    readonly min: number;
    readonly name: string;
    readonly type: PARAMETERTYPE;
    readonly visualization: PARAMETERVISUALIZATION.DIAL | PARAMETERVISUALIZATION.SLIDER;
    readonly group?: ParameterGroup;
    readonly structure?: ParameterStructure;
    readonly tooltip?: string;

    displayName?: string;
    hidden: boolean;
    order?: number;
    value: number | string;

    // #endregion Properties (13)

    // #region Constructors (1)

    constructor(p: IntParameterLogic) {
        this.defval = p.defval;
        this.id = p.id;
        this.max = p.max;
        this.min = p.min;
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