export interface ITreeNodeData<T extends ITreeNodeData<any>> {
  // #region Properties (2)

  /**
   * The ID of the tree node data.
   */
  id: string;
  /**
   * The version of the tree node data.
   * If the version changes, the node data will be marked for an update.
   * A version change can be triggered via {@link updateVersion}. 
   */
  version: string;

  // #endregion Properties (2)

  // #region Public Methods (2)

  /**
   * Clones this node tree data. 
   */
  clone(): T;
  /**
   * Update the version.
   */
  updateVersion(): void;

  // #endregion Public Methods (2)
}