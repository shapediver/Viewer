import { container } from 'tsyringe'
import { UuidGenerator, EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services'

import { ITreeNodeData } from '../interfaces/ITreeNodeData'

export abstract class AbstractTreeNodeData<T extends ITreeNodeData<any>> implements ITreeNodeData<T> {
  // #region Properties (3)

  #version: string;

  readonly #id: string;
  readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);

  // #endregion Properties (3)

  // #region Constructors (1)

  /**
   * Creates a tree node data object.
   * 
   * @param id Id of this data object
   */
  constructor(id?: string) {
    this.#id = id || this.#uuidGenerator.create();
    this.#version = this.#uuidGenerator.create();
  }

  // #endregion Constructors (1)

  // #region Public Accessors (2)

  public get id(): string {
    return this.#id;
  }

  public get version(): string {
    return this.#version;
  }

  // #endregion Public Accessors (2)

  // #region Public Methods (1)

  /**
   * Update the version
   */
  public updateVersion(): void {
    this.#version = this.#uuidGenerator.create();
  }

  // #endregion Public Methods (1)

  // #region Public Abstract Methods (1)

  /**
   * Clones the tree node data.
   */
  public clone(): T {
    const clone = new (<any>this.constructor);
    return clone;
  };

  // #endregion Public Abstract Methods (1)
}