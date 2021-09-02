import { container } from 'tsyringe'
import { InputValidator, Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.services'
import { Session } from '@shapediver/viewer.session-engine.session-engine'
import {
  ShapeDiverResponseOutput,
  ShapeDiverResponseOutputChunk as OutputChunk,
  ShapeDiverResponseOutputDefinition,
  ShapeDiverResponseOutputPart as OutputPart,
} from '@shapediver/api.geometry-api-dto-v1'

export class Output implements ShapeDiverResponseOutputDefinition {
  // #region Properties (15)

  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #sessionEngine: Session;

  readonly chunks?: OutputChunk[];
  readonly dependency!: string[];
  readonly displayName?: string;
  readonly hidden: boolean = false;
  readonly id: string;
  readonly material?: string;
  readonly name: string;
  readonly order?: number;
  readonly uid?: string;

  // #endregion Properties (15)

  // #region Constructors (1)

  constructor(sessionEngine: Session, outputDef: ShapeDiverResponseOutput) {
    try {
      this.#sessionEngine = sessionEngine;

      if (outputDef.dependency !== undefined) this.dependency = outputDef.dependency;
      this.id = outputDef.id;
      this.name = outputDef.name;
      if (outputDef.uid !== undefined) this.uid = outputDef.uid;
      if (outputDef.material !== undefined) this.material = outputDef.material;
      if (outputDef.chunks !== undefined) this.chunks = outputDef.chunks;

      if (outputDef.displayname !== undefined) this.displayName = outputDef.displayname;
      if (outputDef.order !== undefined) this.order = outputDef.order;
      if (outputDef.hidden !== undefined) this.hidden = outputDef.hidden;

      this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).constructor: Initialized output ${JSON.stringify(outputDef)}.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.OUTPUT, e, `Output(${outputDef.id}).constructor: Something unexpected happened.`, true)
    }
  }

  public updateDisplayName(value: string | undefined) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).updateDisplayName: Updating DisplayName to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).updateDisplayName`, value, 'string', false);
      (<any>this.displayName) = value;
      this.#logger.info(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).updateDisplayName: DisplayName was updated to ${this.displayName}.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.OUTPUT, e, `Output(${this.id}).updateDisplayName: Something unexpected happened.`, true)
    }
  }

  public updateHidden(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).updateHidden: Updating Hidden to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).updateHidden`, value, 'boolean');
      (<any>this.hidden) = value;
      this.#logger.info(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).updateHidden: Hidden was updated to ${this.hidden}.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.OUTPUT, e, `Output(${this.id}).updateHidden: Something unexpected happened.`, true)
    }
  }

  public updateOrder(value: number | undefined) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).updateOrder: Updating Order to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).updateOrder`, value, 'number', false);
      (<any>this.order) = value;
      this.#logger.info(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).updateOrder: Order was updated to ${this.order}.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.OUTPUT, e, `Output(${this.id}).updateOrder: Something unexpected happened.`, true)
    }
  }

  // #endregion Constructors (1)
}