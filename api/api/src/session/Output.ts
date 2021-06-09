import { container } from "tsyringe";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { ShapeDiverResponseOutputPart as OutputPart, ShapeDiverResponseOutputChunk as OutputChunk, ShapeDiverResponseOutput } from "@shapediver/api.geometry-api-dto-v1";
import { Session } from "@shapediver/viewer.session-engine.session-engine";

export class Output implements ShapeDiverResponseOutput {
  // #region Properties (15)

  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #sessionEngine: Session;

  readonly bbmax?: number[];
  readonly bbmin?: number[];
  readonly chunks?: OutputChunk[];
  readonly content?: OutputPart[];
  readonly delay?: number;
  readonly dependency: string[];
  readonly id: string;
  readonly material?: string;
  readonly msg?: string;
  readonly name: string;
  readonly uid?: string;
  readonly version: string;

  // #endregion Properties (15)

  // #region Constructors (1)

  constructor(sessionEngine: Session, outputDef: ShapeDiverResponseOutput) {
    this.#sessionEngine = sessionEngine;

    this.dependency = outputDef.dependency;
    this.id = outputDef.uid || outputDef.id;
    this.name = outputDef.name;
    if (outputDef.uid) this.uid = outputDef.uid;
    if (outputDef.material) this.material = outputDef.material;
    if (outputDef.chunks) this.chunks = outputDef.chunks;

    this.version = outputDef.version;
    if (outputDef.delay) this.delay = outputDef.delay;
    if (outputDef.content) this.content = outputDef.content;
    if (outputDef.bbmin) this.bbmin = outputDef.bbmin;
    if (outputDef.bbmax) this.bbmax = outputDef.bbmax;
    if (outputDef.msg) this.msg = outputDef.msg;
  }

  // #endregion Constructors (1)
}