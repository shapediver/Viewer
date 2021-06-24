import { container } from "tsyringe";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { Logger, LOGGINGTOPIC } from "@shapediver/viewer.shared.utils";
import { ShapeDiverResponseOutputPart as OutputPart, ShapeDiverResponseOutputChunk as OutputChunk, ShapeDiverResponseOutput, ShapeDiverResponseOutputDefinition } from "@shapediver/api.geometry-api-dto-v1";
import { Session } from "@shapediver/viewer.session-engine.session-engine";

export class Output implements ShapeDiverResponseOutputDefinition {
  // #region Properties (15)

  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #sessionEngine: Session;

  readonly chunks?: OutputChunk[];
  readonly dependency!: string[];
  readonly id: string;
  readonly material?: string;
  readonly name: string;
  readonly uid?: string;

  // #endregion Properties (15)

  // #region Constructors (1)

  constructor(sessionEngine: Session, outputDef: ShapeDiverResponseOutput) {
    this.#sessionEngine = sessionEngine;

    if (outputDef.dependency) this.dependency = outputDef.dependency;
    this.id = outputDef.uid || outputDef.id;
    this.name = outputDef.name;
    if (outputDef.uid) this.uid = outputDef.uid;
    if (outputDef.material) this.material = outputDef.material;
    if (outputDef.chunks) this.chunks = outputDef.chunks;
    this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Output(${this.id}).constructor: Initialized output ${JSON.stringify(outputDef)}.`);
  }

  // #endregion Constructors (1)
}