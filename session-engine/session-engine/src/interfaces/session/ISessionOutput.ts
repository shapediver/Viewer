import { IContent } from "@shapediver/viewer.shared.types";

export interface ISessionOutput {
    // #region Properties (7)

    bbmax?: number[];
    bbmin?: number[];
    content?: IContent[];
    delay?: number;
    material?: string;
    name?: string;
    version: string;

    // #endregion Properties (7)
}