import { ICallback } from './ICallback'

export interface IListener {
    // #region Properties (2)
    cb: ICallback;
    token: string;
    // #endregion Properties (2)
}