import { ISessionAction } from "./ISessionAction";
import { ISessionExport } from "./ISessionExport";
import { ISessionOutput } from "./ISessionOutput";
import { ISessionParameter } from "./ISessionParameter";


export interface ISession {
    // #region Properties (8)

    actions?: ISessionAction[] | {
        [key: string]: ISessionAction
    };
    config?: {
        [key: string]: any
    };
    exports?: {
        [key: string]: ISessionExport
    };
    msg?: string;
    name?: string;
    outputs?: {
        [key: string]: ISessionOutput
    };
    parameters?: {
        [key: string]: ISessionParameter
    };
    version?: string;

    // #endregion Properties (8)
}