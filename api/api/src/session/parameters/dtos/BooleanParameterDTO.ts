import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { Parameter as ParameterLogic } from "@shapediver/viewer.session-engine.session-engine";

export class BooleanParameterDTO implements IParameter<boolean> {
    readonly choices?: string[] | undefined;
    readonly decimalplaces?: string | undefined;
    readonly defval: string;
    readonly format?: string[] | undefined;
    readonly id: string;
    readonly max?: string | undefined;
    readonly min?: string | undefined;
    readonly name?: string | undefined;
    readonly note?: string | undefined;
    readonly type: PARAMETERTYPE;
    readonly visualization?: PARAMETERVISUALIZATION | undefined;
    hidden: boolean;
    displayName?: string | undefined;
    order?: number | undefined;
    value: boolean;
    
    constructor(p: ParameterLogic) {
        this.choices = p.choices;
        this.decimalplaces = p.decimalplaces;
        this.defval = p.defval;
        this.format = p.format;
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
        this.value = (p.value === "true");
    }
}