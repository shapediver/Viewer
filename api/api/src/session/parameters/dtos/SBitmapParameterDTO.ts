import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { SBitmapParameter as SBitmapParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { ShapeDiverResponseParameterGroup as ParameterGroup, ShapeDiverResponseParameterStructure as ParameterStructure } from "@shapediver/api.geometry-api-dto-v1";

export class SBitmapParameterDTO implements IParameter<File | Blob | string> {
    // #region Properties (10)

    readonly defval: File | Blob | string;
    readonly id: string;
    readonly format: string[];
    readonly max: number;
    readonly name: string;
    readonly type: PARAMETERTYPE;
    readonly visualization: PARAMETERVISUALIZATION.BUTTON;
    readonly group?: ParameterGroup;
    readonly structure?: ParameterStructure;
    readonly tooltip?: string;

    displayName?: string;
    hidden: boolean;
    order?: number;
    value: File | Blob | string;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(p: SBitmapParameterLogic) {
        this.defval = p.defval;
        this.id = p.id;
        this.format = p.format;
        this.max = p.max;
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