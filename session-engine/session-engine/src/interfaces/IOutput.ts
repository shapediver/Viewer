import { IContent } from "@shapediver/viewer.shared.types";

export interface IOutput {
    // #region Properties (8)

    readonly bbmax?: number[];
    readonly bbmin?: number[];
    readonly delay?: number;
    readonly id: string;
    readonly material?: string;
    readonly name?: string;

    content?: IContent[];
    version: string;

    // #endregion Properties (8)
}