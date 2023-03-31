import { IFileParameter } from "@shapediver/viewer.session-engine.session-engine";
import { IFileParameterApi } from "../../interfaces/session/IFileParameterApi";
import { ParameterApi } from "./ParameterApi";
import { Logger, ShapeDiverBackendError, ShapeDiverViewerError } from "@shapediver/viewer.shared.services";

export class FileParameterApi extends ParameterApi<File | Blob | string> implements IFileParameterApi {
    // #region Properties (3)

    readonly #parameter: IFileParameter;
    readonly #logger: Logger = Logger.instance;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(parameter: IFileParameter) {
        super(parameter);
        this.#parameter = parameter;
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public upload(): Promise<string> {
        return this.#parameter.upload();
    }

    // #endregion Public Methods (1)
}