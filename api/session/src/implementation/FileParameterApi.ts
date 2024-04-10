import { IFileParameter } from '@shapediver/viewer.session-engine.session-engine';
import { IFileParameterApi } from '../interfaces/IFileParameterApi';
import { Logger } from '@shapediver/viewer.shared.services';
import { ParameterApi } from './ParameterApi';

export class FileParameterApi extends ParameterApi<File | Blob | string> implements IFileParameterApi {
    // #region Properties (2)

    readonly #logger: Logger = Logger.instance;
    readonly #parameter: IFileParameter;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(parameter: IFileParameter) {
        super(parameter);
        this.#parameter = parameter;
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public async getFilename(fileId?: string): Promise<string | undefined> {
        return this.#parameter.getFilename(fileId);
    }

    public upload(): Promise<string> {
        return this.#parameter.upload();
    }

    // #endregion Public Methods (2)
}