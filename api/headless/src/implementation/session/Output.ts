import { container } from 'tsyringe'
import { InputValidator, Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.services'
import { Session } from '@shapediver/viewer.session-engine.session-engine'
import {
  ShapeDiverResponseOutput,
  ShapeDiverResponseOutputChunk as OutputChunk,
} from '@shapediver/api.geometry-api-dto-v1'

import { IOutput } from '../../interfaces/session/IOutput'
import { ISession } from '../../interfaces/session/ISession'

export class Output implements IOutput {
  // #region Properties (12)

  readonly #chunks?: OutputChunk[];
  readonly #dependency!: string[];
  readonly #id: string;
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #material?: string;
  readonly #name: string;
  readonly #session: ISession;
  readonly #sessionEngine: Session;
  readonly #uid?: string;

  #displayname?: string;
  #hidden: boolean = false;
  #order?: number;
  #tooltip?: string;

  // #endregion Properties (12)

  // #region Constructors (1)

  constructor(session: ISession, sessionEngine: Session, outputDef: ShapeDiverResponseOutput) {
    try {
      this.#session = session;
      this.#sessionEngine = sessionEngine;

      if (outputDef.dependency !== undefined) this.#dependency = outputDef.dependency;
      this.#id = outputDef.id;
      this.#name = outputDef.name;
      if (outputDef.uid !== undefined) this.#uid = outputDef.uid;
      if (outputDef.material !== undefined) this.#material = outputDef.material;
      if (outputDef.chunks !== undefined) this.#chunks = outputDef.chunks;

      if (outputDef.displayname !== undefined) this.#displayname = outputDef.displayname;
      if (outputDef.order !== undefined) this.#order = outputDef.order;
      if (outputDef.hidden !== undefined) this.#hidden = outputDef.hidden;

      this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Output(${this.#id}).constructor: Initialized output ${JSON.stringify(outputDef)}.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.OUTPUT, e, `Output(${outputDef.id}).constructor: Something unexpected happened.`, true)
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (12)

  public get chunks(): OutputChunk[] | undefined {
    return this.#chunks;
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
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.OUTPUT, e, `Output(${this.#id}).displayname: Something unexpected happened.`, true)
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
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.OUTPUT, e, `Output(${this.#id}).hidden: Something unexpected happened.`, true)
    }
  }

  public get id(): string {
    return this.#id;
  }

  public get material(): string | undefined {
    return this.#material;
  }

  public get name(): string {
    return this.#name;
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
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.OUTPUT, e, `Output(${this.#id}).order: Something unexpected happened.`, true)
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
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.OUTPUT, e, `Output(${this.#id}).tooltip: Something unexpected happened.`, true)
    }
  }

  public get uid(): string | undefined {
    return this.#uid;
  }

  // #endregion Public Accessors (12)
}