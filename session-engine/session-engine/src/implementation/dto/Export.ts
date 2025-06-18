import {
	ResComputationStatus,
	ResExport,
	ResExportContent,
	ResExportDefinitionType,
	ResExportResult,
	ResParameterGroup,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	EventEngine,
	EVENTTYPE,
	InputValidator,
	Logger,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {ITaskEvent, TASK_TYPE} from "@shapediver/viewer.shared.types";
import {IExport} from "../../interfaces/dto/IExport";
import {SessionEngine} from "../SessionEngine";

export class Export implements IExport {
	// #region Properties (24)

	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #id: string;
	readonly #inputValidator: InputValidator = InputValidator.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #name: string;
	readonly #sessionEngine: SessionEngine;
	readonly #type: ResExportDefinitionType;
	readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

	#content?: ResExportContent[];
	#delay?: number;
	#dependency!: string[];
	#displayname?: string;
	#filename?: string;
	#group?: ResParameterGroup;
	#hidden: boolean = false;
	#maxWaitTime: number = 300000;
	#msg?: string;
	#order?: number;
	#result?: ResExportResult;
	#status_collect?: ResComputationStatus;
	#status_computation?: ResComputationStatus;
	#tooltip?: string;
	#uid?: string;
	#version: string;

	// #endregion Properties (24)

	// #region Constructors (1)

	constructor(exportDef: ResExport, sessionEngine: SessionEngine) {
		this.#sessionEngine = sessionEngine;
		this.#id = exportDef.id;
		this.#name = exportDef.name;
		this.#type = exportDef.type;
		this.#version = exportDef.version as string;

		this.updateExportDefinition(exportDef);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (24)

	public get content(): ResExportContent[] | undefined {
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
		this.#displayname = value;
	}

	public get filename(): string | undefined {
		return this.#filename;
	}

	public get group(): ResParameterGroup | undefined {
		return this.#group;
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

	public get maxWaitTime(): number {
		return this.#maxWaitTime;
	}

	public set maxWaitTime(value: number) {
		this.#maxWaitTime = value;
	}

	public get msg(): string | undefined {
		return this.#msg;
	}

	public get name(): string {
		return this.#name;
	}

	public get order(): number | undefined {
		return this.#order;
	}

	public set order(value: number | undefined) {
		this.#order = value;
	}

	public get result(): ResExportResult | undefined {
		return this.#result;
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

	public get type(): ResExportDefinitionType {
		return this.#type;
	}

	public get uid(): string | undefined {
		return this.#uid;
	}

	public get version(): string {
		return this.#version;
	}

	// #endregion Public Getters And Setters (24)

	// #region Public Methods (3)

	public async request(
		parameterValues: {[key: string]: unknown} = {},
	): Promise<ResExport> {
		const eventId = this.#uuidGenerator.create();
		try {
			const event: ITaskEvent = {
				type: TASK_TYPE.EXPORT_REQUEST,
				id: eventId,
				progress: 0,
				status: "Requesting export",
			};
			this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, event);

			if (Object.keys(parameterValues).length === 0) {
				this.#logger.info(
					`Export(${this.#id}).request: Sending export request with parameters ${JSON.stringify(parameterValues)}.`,
				);
			} else {
				this.#logger.debugLow(
					`Export(${this.#id}).request: Sending export request.`,
				);
			}

			const exportDef = await this.#sessionEngine.requestExport(
				this.id,
				parameterValues,
				this.#maxWaitTime,
			);
			this.updateExportDefinition(exportDef);

			const eventEnd: ITaskEvent = {
				type: TASK_TYPE.EXPORT_REQUEST,
				id: eventId,
				progress: 1,
				status: "Returning export",
			};
			this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

			return exportDef;
		} catch (e) {
			const eventEnd: ITaskEvent = {
				type: TASK_TYPE.EXPORT_REQUEST,
				id: eventId,
				progress: 1,
				status: "Export request failed",
			};
			this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventEnd);

			throw e;
		}
	}

	public updateExport(e?: ResExport) {
		const exportDef = e || this.#sessionEngine.exports[this.id];
		this.#dependency = exportDef.dependency;
		this.#uid = exportDef.uid;
		this.#displayname = exportDef.displayname;
		this.#order = exportDef.order;
		this.#hidden = exportDef.hidden;
		this.#tooltip = exportDef.tooltip;
		this.#version = exportDef.version;
		this.#delay = exportDef.delay;
		this.#content = exportDef.content;
		this.#msg = exportDef.msg;
		this.#filename = exportDef.filename;
		this.#result = exportDef.result;
		this.#status_computation = exportDef.status_computation;
		this.#status_collect = exportDef.status_collect;
		this.#group = exportDef.group;
	}

	public updateExportDefinition(exportDef: ResExport) {
		this.#dependency = exportDef.dependency;
		this.#uid = exportDef.uid;
		this.#displayname = exportDef.displayname;
		this.#order = exportDef.order;
		this.#hidden = exportDef.hidden;
		this.#tooltip = exportDef.tooltip;
		this.#version = exportDef.version as string;
		this.#delay = exportDef.delay;
		this.#content = exportDef.content;
		this.#msg = exportDef.msg;
		this.#filename = exportDef.filename;
		this.#result = exportDef.result;
		this.#status_computation = exportDef.status_computation;
		this.#status_collect = exportDef.status_collect;
		this.#group = exportDef.group;
	}

	// #endregion Public Methods (3)
}
