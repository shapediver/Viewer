import { ShapeDiverResponseModelComputationStatus } from "@shapediver/api.geometry-api-dto-v2";
import { IOutput, ShapeDiverResponseOutputContent, ShapeDiverResponseOutputChunk } from "@shapediver/viewer.session-engine.session-engine";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";
import { IOutputApi } from "../../interfaces/session/IOutputApi";
import { OutputApiData } from "./data/OutputApiData";

export class OutputApi implements IOutputApi {
    // #region Properties (3)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #output: IOutput;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(output: IOutput) {
        this.#output = output;
        this.#output.updateCallback = (newNode?: ITreeNode, oldNode?: ITreeNode) => {
            if(newNode && newNode.data.findIndex(d => d instanceof OutputApiData) === -1)
                newNode.addData(new OutputApiData(this));
        };
        this.#output.updateCallback(this.node)
    }

    // #endregion Constructors (1)

    // #region Public Accessors (27)

    public get bbmax(): number[] | undefined {
        return this.#output.bbmax;
    }

    public get bbmin(): number[] | undefined {
        return this.#output.bbmin;
    }

    public get chunks(): ShapeDiverResponseOutputChunk[] | undefined {
        return this.#output.chunks;
    }

    public get content(): ShapeDiverResponseOutputContent[] | undefined {
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
        const scope = 'displayname';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, value, 'string', false);
            this.#output.displayname = value;
            this.#logger.debug(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}: ${scope} was updated to ${this.#output.displayname}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, e);
        }
    }

    public get format(): string[] {
        return this.#output.format;
    }

    public get freeze(): boolean {
        return this.#output.freeze;
    }

    public set freeze(value: boolean) {
        const scope = 'freeze';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, value, 'boolean');
            this.#output.freeze = value;
            this.#logger.debug(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}: ${scope} was updated to ${this.#output.freeze}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, e);
        }
    }

    public get hidden(): boolean {
        return this.#output.hidden;
    }

    public set hidden(value: boolean) {
        const scope = 'hidden';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, value, 'boolean');
            this.#output.hidden = value;
            this.#logger.debug(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}: ${scope} was updated to ${this.#output.hidden}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, e);
        }
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
        const scope = 'order';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, value, 'number', false);
            this.#output.order = value;
            this.#logger.debug(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}: ${scope} was updated to ${this.#output.order}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, e);
        }
    }

    public get status_collect(): ShapeDiverResponseModelComputationStatus | undefined {
        return this.#output.status_collect;
    }

    public get status_computation(): ShapeDiverResponseModelComputationStatus | undefined {
        return this.#output.status_computation;
    }

    public get tooltip(): string | undefined {
        return this.#output.tooltip;
    }

    public set tooltip(value: string | undefined) {
        const scope = 'tooltip';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, value, 'string', false);
            this.#output.tooltip = value;
            this.#logger.debug(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}: ${scope} was updated to ${this.#output.tooltip}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, e);
        }
    }

    public get uid(): string | undefined {
        return this.#output.uid;
    }

    public get updateCallback(): ((newNode?: ITreeNode, oldNode?: ITreeNode) => void) | null {
        return this.#output.updateCallback;
    }

    public set updateCallback(value: ((newNode?: ITreeNode, oldNode?: ITreeNode) => void) | null) {
        const scope = 'updateCallback';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, value, 'function', false);
            this.#output.updateCallback = (newNode?: ITreeNode, oldNode?: ITreeNode) => {
                if(newNode && newNode.data.findIndex(d => d instanceof OutputApiData) === -1)
                    newNode.addData(new OutputApiData(this));
                if(value) value(newNode, oldNode);
            };
            this.#logger.debug(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}: ${scope} was updated to ${this.#output.updateCallback}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, e);
        }
    }

    public get version(): string {
        return this.#output.version;
    }

    // #endregion Public Accessors (27)

    // #region Public Methods (2)

    public async updateOutputContent(outputContent: ShapeDiverResponseOutputContent[], preventUpdate: boolean = false): Promise<ITreeNode | undefined> {
        const scope = 'updateOutputContent';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, outputContent, 'array');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, preventUpdate, 'boolean');
            return this.#output.updateOutputContent(outputContent, preventUpdate);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.OUTPUT, `OutputApi.${scope}`, e);
        }
    }

    // #endregion Public Methods (2)
}