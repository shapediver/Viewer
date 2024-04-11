export interface ITreeNodeData {
  // #region Properties (4)

  /**
   * The converted object of the tree node.
   */
  convertedObject: { [key: string]: unknown };
  /**
 * The ID of the tree node data.
 */
  id: string;
  /**
   * The update callback for the converted object of the tree node.
   */
  updateCallbackConvertedObject: ((newObj: unknown, oldObj: unknown, viewport: string) => void) | null;
  /**
 * The version of the tree node data.
 * If the version changes, the node data will be marked for an update.
 * A version change can be triggered via {@link updateVersion}. 
 */
  version: string;

  // #endregion Properties (4)

  // #region Public Methods (2)

  /**
 * Clones this node tree data. 
 */
  clone(): ITreeNodeData;
  /**
 * Update the version.
 */
  updateVersion(): void;

  // #endregion Public Methods (2)
}