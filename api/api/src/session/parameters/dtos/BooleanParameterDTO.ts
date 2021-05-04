import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { BooleanParameter as BooleanParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { ShapeDiverResponseParameterGroup as ParameterGroup, ShapeDiverResponseParameterStructure as ParameterStructure } from "@shapediver/api.geometry-api-dto-v1";

export class BooleanParameterDTO implements IParameter<boolean | string> {
    // #region Properties (10)

    readonly defval: boolean;
    readonly id: string;
    readonly name: string;
    readonly type: PARAMETERTYPE;
    readonly visualization: PARAMETERVISUALIZATION.TOGGLE;
    readonly group?: ParameterGroup;
    readonly structure?: ParameterStructure;
    readonly tooltip?: string;

    displayName?: string;
    hidden: boolean;
    order?: number;
    value: boolean | string;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(p: BooleanParameterLogic) {
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