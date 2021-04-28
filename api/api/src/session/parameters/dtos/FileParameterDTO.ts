import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { FileParameter as FileParameterLogic } from "@shapediver/viewer.session-engine.session-engine";

export class FileParameterDTO implements IParameter<File | Blob | string> {
    // #region Properties (10)

    readonly defval: File | Blob | string;
    readonly id: string;
    readonly format: string[];
    readonly max: number;
    readonly name: string;
    readonly type: PARAMETERTYPE;
    readonly visualization: PARAMETERVISUALIZATION.BUTTON;

    displayName?: string;
    hidden: boolean;
    order?: number;
    value: File | Blob | string;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(p: FileParameterLogic) {
        this.defval = p.defval;
        this.id = p.id;
        this.format = p.format;
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