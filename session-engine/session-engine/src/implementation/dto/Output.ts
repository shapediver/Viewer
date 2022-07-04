import { ShapeDiverResponseModelComputationStatus, ShapeDiverResponseOutput } from "@shapediver/sdk.geometry-api-sdk-v2";
import { container } from "tsyringe";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { InputValidator, UuidGenerator, LOGGING_TOPIC, ShapeDiverViewerError, ShapeDiverBackendError, Logger } from "@shapediver/viewer.shared.services";
import { IOutput, ShapeDiverResponseOutputContent, ShapeDiverResponseOutputChunk } from "../../interfaces/dto/IOutput";
import { SessionEngine } from "../SessionEngine";

export class Output implements IOutput {
  // #region Properties (23)

  readonly #id: string;
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #name: string;
  readonly #sessionEngine: SessionEngine;
  readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

  #bbmax?: number[];
  #bbmin?: number[];
  #chunks?: ShapeDiverResponseOutputChunk[];
  #content?: ShapeDiverResponseOutputContent[];
  #delay?: number;
  #dependency!: string[];
  #displayname?: string;
  #hidden: boolean = false;
  #material?: string;
  #msg?: string;
  #order?: number;
  #status_collect?: ShapeDiverResponseModelComputationStatus;
  #status_computation?: ShapeDiverResponseModelComputationStatus;
  #tooltip?: string;
  #uid?: string;
  #updateCallback: ((newNode?: ITreeNode, oldNode?: ITreeNode) => void) | null = null;
  #version: string;

  // #endregion Properties (23)

  // #region Constructors (1)

  constructor(outputDef: ShapeDiverResponseOutput, sessionEngine: SessionEngine) {
    this.#sessionEngine = sessionEngine;

    this.#id = outputDef.id;
    this.#name = outputDef.name;
    this.#version = outputDef.version;
    this.updateOutputDefinition(outputDef);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (28)

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

  public set content(value: ShapeDiverResponseOutputContent[] | undefined) {
    this.#content = value;
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
    this.#displayname = value;
  }

  public get format(): string[] {
    return this.#content ? this.#content.map(c => c.format) : [];
  }

  public get freeze(): boolean {
    return this.#sessionEngine.outputsFreeze[this.#id];
  }

  public set freeze(value: boolean) {
    this.#sessionEngine.outputsFreeze[this.#id] = value;
  }

  public get hidden(): boolean {
    return this.#hidden;
  }

  public set hidden(value: boolean) {
    this.#hidden = value;
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

  public get node(): ITreeNode {
    return this.#sessionEngine.node.children.find(c => c.name === this.id)!;
  }

  public get order(): number | undefined {
    return this.#order;
  }

  public set order(value: number | undefined) {
    this.#order = value;
  }

  public get status_collect(): ShapeDiverResponseModelComputationStatus | undefined {
    return this.#status_collect;
  }

  public get status_computation(): ShapeDiverResponseModelComputationStatus | undefined {
    return this.#status_computation;
  }

  public get tooltip(): string | undefined {
    return this.#tooltip;
  }

  public set tooltip(value: string | undefined) {
    this.#tooltip = value;
  }

  public get uid(): string | undefined {
    return this.#uid;
  }

  public get updateCallback(): ((newNode?: ITreeNode, oldNode?: ITreeNode) => void) | null {
    return this.#updateCallback;
  }

  public set updateCallback(value: ((newNode?: ITreeNode, oldNode?: ITreeNode) => void) | null) {
    this.#updateCallback = value;
  }

  public get version(): string {
    return this.#version;
  }

  public set version(value: string) {
    this.#version = value;
  }

  // #endregion Public Accessors (28)

  // #region Public Methods (3)

  public updateOutput(newNode?: TreeNode, oldNode?: TreeNode) {
    const outputDef = this.#sessionEngine.outputs[this.id];
    this.updateOutputDefinition(outputDef);

    // add chunk nodes
    if (this.chunks && newNode) {
      for (let i = 0; i < newNode.children.length; i++) {
        for (let j = 0; j < this.chunks.length; j++) {
          this.chunks[j].node = newNode.children[i].children.find(child => child.name === this.chunks![j].id);
        }
      }
    }

    if (this.#updateCallback) this.#updateCallback(newNode, oldNode);
  }

  public async updateOutputContent(outputContent: ShapeDiverResponseOutputContent[], preventUpdate: boolean = false): Promise<ITreeNode | undefined> {
    this.#sessionEngine.outputs[this.id].content = outputContent;
    this.#sessionEngine.outputs[this.id].version = this.#uuidGenerator.create();
    if (!preventUpdate) await this.#sessionEngine.updateOutputs();
    return this.node;
  }

  public updateOutputDefinition(outputDef: ShapeDiverResponseOutput) {
    this.#dependency = outputDef.dependency;
    this.#uid = outputDef.uid;
    this.#material = outputDef.material;
    this.#chunks = outputDef.chunks;
    this.#msg = outputDef.msg;
    if (this.#msg !== undefined)
      this.#logger.warn(LOGGING_TOPIC.OUTPUT, `Output(${this.id}): ${this.#msg}`);
    this.#bbmin = outputDef.bbmin;
    this.#bbmax = outputDef.bbmax;
    this.#status_computation = outputDef.status_computation;
    this.#status_collect = outputDef.status_collect;
    this.#content = outputDef.content;
    this.#delay = outputDef.delay;
    this.#version = outputDef.version;
    this.#displayname = outputDef.displayname;
    this.#order = outputDef.order;
    this.#hidden = outputDef.hidden;
  }

  // #endregion Public Methods (3)
}