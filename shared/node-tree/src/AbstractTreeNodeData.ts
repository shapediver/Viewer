import { container } from 'tsyringe'

import { UuidGenerator } from '@shapediver/viewer.shared.utils';
import { ITreeNodeData } from './interfaces/ITreeNodeData';

export abstract class AbstractTreeNodeData implements ITreeNodeData {
  // #region Properties (3)

  private _version: string;

  protected readonly _id: string;
  protected readonly _uuidGenerator = container.resolve(UuidGenerator);

  // #endregion Properties (3)

  // #region Constructors (1)

  /**
   * Creates a tree node data object.
   * 
   * @param id Id of this data object
   */
  constructor(id?: string) {
    this._id = id || this._uuidGenerator.create();
    this._version = this._uuidGenerator.create();
  }

  // #endregion Constructors (1)

  // #region Public Accessors (2)

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Getter version
   * @return {string}
   */
  public get version(): string {
    return this._version;
  }

  // #endregion Public Accessors (2)

  // #region Public Methods (1)

  /**
   * Update the version
   */
  public updateVersion(): void {
    this._version = this._uuidGenerator.create();
  }

  // #endregion Public Methods (1)

  // #region Public Abstract Methods (1)

  /**
   * Clones the tree node data.
   */
  public abstract clone(): ITreeNodeData;

  // #endregion Public Abstract Methods (1)
}