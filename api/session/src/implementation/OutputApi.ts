import {ResComputationStatus} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	type IOutput,
	type ResOutputChunk,
	type ResOutputContent} from "@shapediver/viewer.session-engine.session-engine";
import {type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {InputValidator, Logger} from "@shapediver/viewer.shared.services";
import {type IOutputApi} from "../interfaces/IOutputApi";
import {OutputApiData} from "./data/OutputApiData";

export class OutputApi implements IOutputApi {
	// #region Properties (3)

	readonly #inputValidator: InputValidator = InputValidator.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #output: IOutput;

	// #endregion Properties (3)

	// #region Constructors (1)

	constructor(output: IOutput) {
		this.#output = output;
		this.#output.updateCallback = (newNode?: ITreeNode) => {
			if (
				newNode &&
				newNode.data.findIndex((d) => d instanceof OutputApiData) === -1
			)
				newNode.addData(new OutputApiData(this));
		};
		this.#output.updateCallback(this.node);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (28)

	public get bbmax(): number[] | undefined {
		return this.#output.bbmax;
	}

	public get bbmin(): number[] | undefined {
		return this.#output.bbmin;
	}

	public get chunks(): ResOutputChunk[] | undefined {
		return this.#output.chunks;
	}

	public get content(): ResOutputContent[] | undefined {
		return this.#output.content;
	}

	public get delay(): number | undefined {
		return this.#output.delay;
	}

	public get dependency(): string[] {
		return this.#output.dependency;
	}

	public get displayname(): string | undefined {
		return this.#output.displayname;
	}

	public set displayname(value: string | undefined) {
		const scope = "displayname";
		this.#inputValidator.validateAndError(
			`OutputApi.${scope}`,
			value,
			"string",
			false,
		);
		this.#output.displayname = value;
		this.#logger.debug(
			`OutputApi.${scope}: ${scope} was updated to ${this.#output.displayname}.`,
		);
	}

	public get format(): string[] {
		return this.#output.format;
	}

	public get freeze(): boolean {
		return this.#output.freeze;
	}

	public set freeze(value: boolean) {
		const scope = "freeze";
		this.#inputValidator.validateAndError(
			`OutputApi.${scope}`,
			value,
			"boolean",
		);
		this.#output.freeze = value;
		this.#logger.debug(
			`OutputApi.${scope}: ${scope} was updated to ${this.#output.freeze}.`,
		);
	}

	public get hidden(): boolean {
		return this.#output.hidden;
	}

	public set hidden(value: boolean) {
		const scope = "hidden";
		this.#inputValidator.validateAndError(
			`OutputApi.${scope}`,
			value,
			"boolean",
		);
		this.#output.hidden = value;
		this.#logger.debug(
			`OutputApi.${scope}: ${scope} was updated to ${this.#output.hidden}.`,
		);
	}

	public get id(): string {
		return this.#output.id;
	}

	public get material(): string | undefined {
		return this.#output.material;
	}

	public get msg(): string | undefined {
		return this.#output.msg;
	}

	public get name(): string {
		return this.#output.name;
	}

	public get node(): ITreeNode | undefined {
		return this.#output.node;
	}

	public get order(): number | undefined {
		return this.#output.order;
	}

	public set order(value: number | undefined) {
		const scope = "order";
		this.#inputValidator.validateAndError(
			`OutputApi.${scope}`,
			value,
			"number",
			false,
		);
		this.#output.order = value;
		this.#logger.debug(
			`OutputApi.${scope}: ${scope} was updated to ${this.#output.order}.`,
		);
	}

	public get status_collect(): ResComputationStatus | undefined {
		return this.#output.status_collect;
	}

	public get status_computation(): ResComputationStatus | undefined {
		return this.#output.status_computation;
	}

	public get tooltip(): string | undefined {
		return this.#output.tooltip;
	}

	public set tooltip(value: string | undefined) {
		const scope = "tooltip";
		this.#inputValidator.validateAndError(
			`OutputApi.${scope}`,
			value,
			"string",
			false,
		);
		this.#output.tooltip = value;
		this.#logger.debug(
			`OutputApi.${scope}: ${scope} was updated to ${this.#output.tooltip}.`,
		);
	}

	public get uid(): string | undefined {
		return this.#output.uid;
	}

	public get updateCallback():
		| ((newNode?: ITreeNode, oldNode?: ITreeNode) => void | Promise<void>)
		| null {
		return this.#output.updateCallback;
	}

	public set updateCallback(
		value:
			| ((
					newNode?: ITreeNode,
					oldNode?: ITreeNode,
			  ) => void | Promise<void>)
			| null,
	) {
		const scope = "updateCallback";
		if (value)
			this.#inputValidator.validateAndError(
				`OutputApi.${scope}`,
				value,
				"function",
				false,
			);
		this.#output.updateCallback = async (
			newNode?: ITreeNode,
			oldNode?: ITreeNode,
		) => {
			if (
				newNode &&
				newNode.data.findIndex((d) => d instanceof OutputApiData) === -1
			)
				newNode.addData(new OutputApiData(this));
			if (value) await Promise.resolve(value(newNode, oldNode));
		};
		this.#logger.debug(
			`OutputApi.${scope}: ${scope} was updated to ${value}.`,
		);
	}

	public get version(): string {
		return this.#output.version;
	}

	// #endregion Public Getters And Setters (28)

	// #region Public Methods (1)

	public async updateOutputContent(
		outputContent: ResOutputContent[],
		preventUpdate: boolean = false,
	): Promise<ITreeNode | undefined> {
		const scope = "updateOutputContent";
		this.#inputValidator.validateAndError(
			`OutputApi.${scope}`,
			outputContent,
			"array",
		);
		this.#inputValidator.validateAndError(
			`OutputApi.${scope}`,
			preventUpdate,
			"boolean",
		);
		return this.#output.updateOutputContent(outputContent, preventUpdate);
	}

	// #endregion Public Methods (1)
}

export const isOutputApi = (obj: unknown): obj is IOutputApi =>
	obj instanceof OutputApi;
