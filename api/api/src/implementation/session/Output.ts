import { container } from 'tsyringe'
import { InputValidator, Logger, LOGGINGTOPIC, ShapeDiverBackendError, ShapeDiverViewerError, UuidGenerator } from '@shapediver/viewer.shared.services'
import { Session } from '@shapediver/viewer.session-engine.session-engine'

import { IOutput, ShapeDiverResponseOutput, ShapeDiverResponseOutputContent } from '../../interfaces/session/IOutput'
import { ISession } from '../../interfaces/session/ISession'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { ShapeDiverResponseOutputChunk } from '@shapediver/sdk.geometry-api-sdk-v2'

export class Output implements IOutput {
  // #region Properties (21)

  readonly #chunks?: ShapeDiverResponseOutputChunk[];
  readonly #dependency!: string[];
  readonly #id: string;
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #material?: string;
  readonly #name: string;
  readonly #session: ISession;
  readonly #sessionEngine: Session;
  readonly #uid?: string;
  readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

  #bbmax?: number[];
  #bbmin?: number[];
  #content?: ShapeDiverResponseOutputContent[];
  #delay?: number;
  #displayname?: string;
  #hidden: boolean = false;
  #msg?: string;
  #order?: number;
  #tooltip?: string;
  #updateCallback: ((newNode: TreeNode, oldNode: TreeNode) => void) | null = null;
  #version: string;

  // #endregion Properties (21)

  // #region Constructors (1)

  constructor(session: ISession, sessionEngine: Session, outputDef: ShapeDiverResponseOutput) {
    try {
      this.#session = session;
      this.#sessionEngine = sessionEngine;

      if (outputDef.dependency !== undefined) this.#dependency = outputDef.dependency;
      this.#id = outputDef.id;
      this.#name = outputDef.name;
      this.#version = outputDef.version;
      if (outputDef.uid !== undefined) this.#uid = outputDef.uid;
      if (outputDef.material !== undefined) this.#material = outputDef.material;
      if (outputDef.chunks !== undefined) this.#chunks = outputDef.chunks;
      if (outputDef.msg !== undefined) this.#msg = outputDef.msg;
      if (outputDef.bbmin !== undefined) this.#bbmin = outputDef.bbmin;
      if (outputDef.bbmax !== undefined) this.#bbmax = outputDef.bbmax;
      if (outputDef.content !== undefined) this.#content = outputDef.content;
      if (outputDef.delay !== undefined) this.#delay = outputDef.delay;

      if (outputDef.displayname !== undefined) this.#displayname = outputDef.displayname;
      if (outputDef.order !== undefined) this.#order = outputDef.order;
      if (outputDef.hidden !== undefined) this.#hidden = outputDef.hidden;

      this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).constructor: Initialized output ${JSON.stringify(outputDef)}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.OUTPUT, `Output(${outputDef.id}).constructor`, e);
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (21)

  public get bbmax(): number[] | undefined {
    return this.#bbmax;
  }

  public get bbmin(): number[] | undefined {
    return this.#bbmin;
  }

  public get chunks(): ShapeDiverResponseOutputChunk[] | undefined {
    return this.#chunks;
  }

  public get content(): ShapeDiverResponseOutputContent[] | undefined {
    return this.#content;
  }

  public get delay(): number | undefined {
    return this.#delay;
  }

  public get dependency(): string[] {
    return this.#dependency;
  }

  public get displayname(): string | undefined {
    return this.#displayname;
  }

  public set displayname(value: string | undefined) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).displayname: Updating DisplayName to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).displayname`, value, 'string', false);
      this.#displayname = value;
      this.#logger.info(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).displayname: DisplayName was updated to ${this.displayname}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).displayname`, e);
    }
  }

  public get freeze(): boolean {
    return this.#sessionEngine.outputsFreeze[this.#id];
  }

  public set freeze(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).freeze: Updating Freeze to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).freeze`, value, 'boolean');
      this.#sessionEngine.outputsFreeze[this.#id] = value;
      this.#logger.info(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).freeze: Freeze was updated to ${this.freeze}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).freeze`, e);
    }
  }

  public get hidden(): boolean {
    return this.#hidden;
  }

  public set hidden(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).hidden: Updating Hidden to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).hidden`, value, 'boolean');
      this.#hidden = value;
      this.#logger.info(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).hidden: Hidden was updated to ${this.hidden}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).hidden`, e);
    }
  }

  public get id(): string {
    return this.#id;
  }

  public get material(): string | undefined {
    return this.#material;
  }

  public get msg(): string | undefined {
    return this.#msg;
  }

  public get name(): string {
    return this.#name;
  }

  public get node(): TreeNode | undefined {
    return this.#session.node.children.find(c => c.name === this.id);
  }

  public get order(): number | undefined {
    return this.#order;
  }

  public set order(value: number | undefined) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).order: Updating Order to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).order`, value, 'number', false);
      this.#order = value;
      this.#logger.info(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).order: Order was updated to ${this.order}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).order`, e);
    }
  }

  public get tooltip(): string | undefined {
    return this.#tooltip;
  }

  public set tooltip(value: string | undefined) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).tooltip: Updating tooltip to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).tooltip`, value, 'string', false);
      this.#tooltip = value;
      this.#logger.info(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).tooltip: tooltip was updated to ${this.tooltip}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).tooltip`, e);
    }
  }

  public get uid(): string | undefined {
    return this.#uid;
  }

  public get version(): string {
    return this.#version;
  }

  // #endregion Public Accessors (21)

  // #region Public Methods (4)

  public addUpdateCallback(cb: (newNode: TreeNode, oldNode: TreeNode) => void): void {
    this.#updateCallback = cb;
  }

  public removeUpdateCallback(): boolean {
    if(!this.#updateCallback) return false;
    this.#updateCallback = null;
    return true;
  }

  public updateOutput(newNode: TreeNode, oldNode: TreeNode) {
    const outputDef = this.#sessionEngine.outputs[this.id];
    this.#version = outputDef.version;
    this.#delay = outputDef.delay;
    this.#content = outputDef.content;
    this.#bbmin = outputDef.bbmin;
    this.#bbmax = outputDef.bbmax;
    this.#msg = outputDef.msg;
    if(this.#updateCallback) this.#updateCallback(newNode, oldNode);
  }

  public async updateOutputContent(outputContent: ShapeDiverResponseOutputContent[], preventUpdate: boolean = false): Promise<TreeNode | undefined> {
    this.#sessionEngine.outputs[this.id].content = outputContent;
    this.#sessionEngine.outputs[this.id].version = this.#uuidGenerator.create();
    if(!preventUpdate) await this.#session.updateOutputs();
    return this.node;
  }

  // #endregion Public Methods (4)
}