import { ISessionOutputContent } from "./ISessionOutputContent";

export interface ISessionOutput {
    // #region Properties (7)

    bbmax?: number[];
    bbmin?: number[];
    content?: ISessionOutputContent[];
    delay?: number;
    material?: string;
    name?: string;
    version: string;

    // #endregion Properties (7)
}