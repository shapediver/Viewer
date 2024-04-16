import { ITreeNodeData } from '../interfaces/ITreeNodeData';
import { UuidGenerator } from '@shapediver/viewer.shared.services';

export abstract class AbstractTreeNodeData implements ITreeNodeData {
  // #region Properties (5)

  readonly #id: string;
  readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

  #convertedObject: { [key: string]: unknown } = {};
  #updateCallbackConvertedObject: ((newObj: unknown, oldObj: unknown, viewport: string) => void) | null = null;
  #version: string;

  // #endregion Properties (5)

  // #region Constructors (1)

  /**
   * Creates a tree node data object.
   * 
   * @param id Id of this data object
   */
  constructor(id?: string, version?: string) {
    this.#id = id || this.#uuidGenerator.create();
    this.#version = version || this.#uuidGenerator.create();
  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (6)

  public get convertedObject(): { [key: string]: unknown } {
    return this.#convertedObject;
  }

  public set convertedObject(value: { [key: string]: unknown }) {
    this.#convertedObject = value;
  }

  public get id(): string {
    return this.#id;
  }

  public get updateCallbackConvertedObject(): ((newObj: unknown, oldObj: unknown, viewport: string) => void) | null {
    return this.#updateCallbackConvertedObject;
  }

  public set updateCallbackConvertedObject(value: ((newObj: unknown, oldObj: unknown, viewport: string) => void) | null) {
    this.#updateCallbackConvertedObject = value;
  }

  public get version(): string {
    return this.#version;
  }

  // #endregion Public Getters And Setters (6)

  // #region Public Methods (2)

  /**
   * Clones the tree node data.
   */
  public clone(): ITreeNodeData {
    const clone = new (this.constructor as new () => ITreeNodeData)();
    return clone;
  }

  /**
   * Update the version
   */
  public updateVersion(): void {
    this.#version = this.#uuidGenerator.create();
  }

  // #endregion Public Methods (2)
}