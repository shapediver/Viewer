import { ShapeDiverResponseParameterStructure, ShapeDiverResponseParameterGroup } from "@shapediver/api.geometry-api-dto-v2";
import { InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError, ShapeDiverViewerSessionError } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";
import { IParameter, PARAMETER_TYPE, PARAMETER_VISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { IParameterApi } from "../../interfaces/session/IParameterApi";

export class ParameterApi<T> implements IParameterApi<T> {
    // #region Properties (3)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #parameter: IParameter<T>;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(parameter: IParameter<T>) {
        this.#parameter = parameter;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (25)

    public get choices(): string[] | undefined {
        return this.#parameter.choices;
    }

    public get decimalplaces(): number | undefined {
        return this.#parameter.decimalplaces;
    }

    public get defval(): string {
        return this.#parameter.defval;
    }

    public get displayname(): string | undefined {
        return this.#parameter.displayname;
    }

    public set displayname(value: string | undefined) {
        const scope = 'displayname';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, value, 'string', false);
            this.#parameter.displayname = value;
            this.#logger.debug(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}: ${scope} was set to ${this.#parameter.displayname}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, e);
        }
    }

    public get expression(): string | undefined {
        return this.#parameter.expression;
    }

    public get format(): string[] | undefined {
        return this.#parameter.format;
    }

    public get group(): ShapeDiverResponseParameterGroup | undefined {
        return this.#parameter.group;
    }

    public get hidden(): boolean {
        return this.#parameter.hidden;
    }

    public set hidden(value: boolean) {
        const scope = 'hidden';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, value, 'boolean');
            this.#parameter.hidden = value;
            this.#logger.debug(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}: ${scope} was set to ${this.#parameter.hidden}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, e);
        }
    }

    public get id(): string {
        return this.#parameter.id;
    }

    public get max(): number | undefined {
        return this.#parameter.max;
    }

    public get min(): number | undefined {
        return this.#parameter.min;
    }

    public get name(): string {
        return this.#parameter.name;
    }

    public get order(): number | undefined {
        return this.#parameter.order;
    }

    public set order(value: number | undefined) {
        const scope = 'order';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, value, 'number', false);
            this.#parameter.order = value;
            this.#logger.debug(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}: ${scope} was set to ${this.#parameter.order}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, e);
        }
    }

    public get sessionValue(): T | string {
        return this.#parameter.sessionValue;
    }

    public set sessionValue(value: T | string) {
        const scope = 'sessionValue';
        try {
            this.#parameter.sessionValue = value;
            this.#logger.debug(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}: ${scope} was set to ${this.#parameter.value}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, e);
        }
    }

    public get structure(): ShapeDiverResponseParameterStructure | undefined {
        return this.#parameter.structure;
    }

    public get tooltip(): string | undefined {
        return this.#parameter.tooltip;
    }

    public set tooltip(value: string | undefined) {
        const scope = 'tooltip';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, value, 'string', false);
            this.#parameter.tooltip = value;
            this.#logger.debug(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}: ${scope} was set to ${this.#parameter.tooltip}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, e);
        }
    }

    public get type(): PARAMETER_TYPE {
        return <PARAMETER_TYPE>this.#parameter.type;
    }

    public get value(): T | string {
        return this.#parameter.value;
    }

    public set value(value: T | string) {
        const scope = 'value';
        try {
            this.#parameter.value = value;
            this.#logger.debug(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}: ${scope} was set to ${this.#parameter.value}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, e);
        }
    }

    public get visualization(): PARAMETER_VISUALIZATION | undefined {
        return <PARAMETER_VISUALIZATION>this.#parameter.visualization;
    }

    // #endregion Public Accessors (25)

    // #region Public Methods (4)

    public isValid(value: any, throwError?: boolean): boolean {
        const scope = 'isValid';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, throwError, 'boolean', false);
            return this.#parameter.isValid(value, throwError);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, e);
        }
    }

    public resetToDefaultValue(): void {
        const scope = 'resetToDefaultValue';
        try {
            return this.#parameter.resetToDefaultValue();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, e);
        }
    }

    public resetToSessionValue(): void {
        const scope = 'resetToSessionValue';
        try {
            return this.#parameter.resetToSessionValue();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, e);
        }
    }

    public stringify(): string {
        const scope = 'stringify';
        try {
            return this.#parameter.stringify();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `ParameterApi.${scope}`, e);
        }
    }

    // #endregion Public Methods (4)
}