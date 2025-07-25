import {
	ResComputationStatus,
	ResOutput,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {ITreeNode, TreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	InputValidator,
	Logger,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {ChunkData} from "@shapediver/viewer.shared.types";
import {
	IOutput,
	ResOutputChunk,
	ResOutputContent,
} from "../../interfaces/dto/IOutput";
import {SessionEngine} from "../SessionEngine";

export class Output implements IOutput {
	// #region Properties (23)

	readonly #id: string;
	readonly #inputValidator: InputValidator = InputValidator.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #name: string;
	readonly #sessionEngine: SessionEngine;
	readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

	#bbmax?: number[];
	#bbmin?: number[];
	#chunks?: ResOutputChunk[];
	#content?: ResOutputContent[];
	#delay?: number;
	#dependency!: string[];
	#displayname?: string;
	#hidden: boolean = false;
	#material?: string;
	#msg?: string;
	#order?: number;
	#status_collect?: ResComputationStatus;
	#status_computation?: ResComputationStatus;
	#tooltip?: string;
	#uid?: string;
	#updateCallback:
		| ((newNode?: ITreeNode, oldNode?: ITreeNode) => void)
		| null = null;
	#version: string;

	// #endregion Properties (23)

	// #region Constructors (1)

	constructor(outputDef: ResOutput, sessionEngine: SessionEngine) {
		this.#sessionEngine = sessionEngine;

		this.#id = outputDef.id;
		this.#name = outputDef.name;
		this.#version = outputDef.version as string;
		this.updateOutputDefinition(outputDef);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (30)

	public get bbmax(): number[] | undefined {
		return this.#bbmax;
	}

	public get bbmin(): number[] | undefined {
		return this.#bbmin;
	}

	public get chunks(): ResOutputChunk[] | undefined {
		return this.#chunks;
	}

	public get content(): ResOutputContent[] | undefined {
		return this.#content;
	}

	public set content(value: ResOutputContent[] | undefined) {
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
		return this.#content ? this.#content.map((c) => c.format) : [];
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
		return this.#sessionEngine.node.children.find(
			(c) => c.name === this.id,
		)!;
	}

	public get order(): number | undefined {
		return this.#order;
	}

	public set order(value: number | undefined) {
		this.#order = value;
	}

	public get status_collect(): ResComputationStatus | undefined {
		return this.#status_collect;
	}

	public get status_computation(): ResComputationStatus | undefined {
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

	public get updateCallback():
		| ((newNode?: ITreeNode, oldNode?: ITreeNode) => void)
		| null {
		return this.#updateCallback;
	}

	public set updateCallback(
		value: ((newNode?: ITreeNode, oldNode?: ITreeNode) => void) | null,
	) {
		this.#updateCallback = value;
	}

	public get version(): string {
		return this.#version;
	}

	public set version(value: string) {
		this.#version = value;
	}

	// #endregion Public Getters And Setters (30)

	// #region Public Methods (4)

	public async triggerUpdateCallback(newNode?: TreeNode, oldNode?: TreeNode) {
		if (this.#updateCallback)
			await Promise.resolve(this.#updateCallback(newNode, oldNode));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public updateOutput(newNode?: TreeNode, oldNode?: TreeNode) {
		const outputDef = this.#sessionEngine.outputs[this.id];
		this.updateOutputDefinition(outputDef);

		// add chunk nodes
		if (this.chunks && newNode) {
			newNode.traverse((child) => {
				if (!this.chunks) return;
				for (let j = 0; j < this.chunks.length; j++) {
					// if the chunk
					if (child.name === this.chunks![j].id) {
						this.chunks[j].node = child;
						// add chunk data to the child
						child.addData(new ChunkData(this.chunks![j]));
					}
				}
			});
		}
	}

	public async updateOutputContent(
		outputContent: ResOutputContent[],
		preventUpdate: boolean = false,
		waitForViewportUpdate: boolean = false,
	): Promise<ITreeNode | undefined> {
		this.#sessionEngine.outputs[this.id].content = outputContent;
		this.#sessionEngine.outputs[this.id].version =
			this.#uuidGenerator.create();
		if (!preventUpdate)
			await this.#sessionEngine.updateOutputs(
				undefined,
				waitForViewportUpdate,
			);
		return this.node;
	}

	public updateOutputDefinition(outputDef: ResOutput) {
		this.#dependency = outputDef.dependency;
		this.#uid = outputDef.uid;
		this.#material = outputDef.material;
		this.#chunks = outputDef.chunks;
		this.#msg = outputDef.msg;
		if (this.#msg !== undefined)
			this.#logger.warn(`Output(${this.id}): ${this.#msg}`);
		this.#bbmin = outputDef.bbmin;
		this.#bbmax = outputDef.bbmax;
		this.#status_computation = outputDef.status_computation;
		this.#status_collect = outputDef.status_collect;
		this.#content = outputDef.content;
		this.#delay = outputDef.delay;
		this.#version = outputDef.version as string;
		this.#displayname = outputDef.displayname;
		this.#order = outputDef.order;
		this.#hidden = outputDef.hidden;
	}

	// #endregion Public Methods (4)
}
