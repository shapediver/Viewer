import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { StringListParameter as StringListParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { ShapeDiverResponseParameterGroup as ParameterGroup, ShapeDiverResponseParameterStructure as ParameterStructure } from "@shapediver/api.geometry-api-dto-v1";

export class StringListParameterDTO implements IParameter<string> {
    // #region Properties (13)

    readonly defval: string;
    readonly choices: string[];
    readonly id: string;
    readonly name: string;
    readonly type: PARAMETERTYPE;
    readonly visualization: PARAMETERVISUALIZATION.SEQUENCE | PARAMETERVISUALIZATION.CYCLE | PARAMETERVISUALIZATION.DROPDOWN | PARAMETERVISUALIZATION.CHECKLIST;
    readonly group?: ParameterGroup;
    readonly structure?: ParameterStructure;
    readonly tooltip?: string;

    displayName?: string;
    hidden: boolean;
    order?: number;
    value: string;

    // #endregion Properties (13)

    // #region Constructors (1)

    constructor(p: StringListParameterLogic) {
        this.defval = p.defval;
        this.choices = p.choices;
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