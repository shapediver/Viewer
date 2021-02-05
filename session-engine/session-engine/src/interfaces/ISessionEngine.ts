import { SessionTreeNode } from "../implementation/SessionTreeNode";

export interface ISessionEngine {
    // #region Public Methods (2)

    customize(parameters: { [key: string]: string }): Promise<SessionTreeNode>;
    init(): Promise<SessionTreeNode>;

    // #endregion Public Methods (2)
}