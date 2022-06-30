import { IFileParameter } from "@shapediver/viewer.session-engine.session-engine";
import { IFileParameterApi } from "../../interfaces/session/IFileParameterApi";
import { ParameterApi } from "./ParameterApi";
import { Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";

export class FileParameterApi extends ParameterApi<File | Blob | string> implements IFileParameterApi {
    // #region Properties (3)

    readonly #parameter: IFileParameter;
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(parameter: IFileParameter) {
        super(parameter);
        this.#parameter = parameter;
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public upload(): Promise<string> {
        const scope = 'upload';
        try {
            return this.#parameter.upload();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `FileParameterApi.${scope}`, e);
        }
    }

    // #endregion Public Methods (1)
}