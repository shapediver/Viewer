import { ShapeDiverResponseParameter } from "@shapediver/sdk.geometry-api-sdk-v2";
import { Logger, LOGGING_TOPIC, ShapeDiverViewerSessionError, UuidGenerator } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";
import { IFileParameter } from "../../interfaces/dto/IFileParameter";
import { Parameter } from "./Parameter";
import * as MimeTypeUtils from "@shapediver/viewer.utils.mime-type"
import { SessionEngine } from "../SessionEngine";

export class FileParameter extends Parameter<File | Blob | string> implements IFileParameter {
    // #region Properties (5)

    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #sessionEngine: SessionEngine;
    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(paramDef: ShapeDiverResponseParameter, sessionEngine: SessionEngine) {
        super(paramDef, sessionEngine);
        this.#sessionEngine = sessionEngine;
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public async upload() {
        if (this.value === undefined) return this.defval;
        if (typeof this.value === 'string' && ((this.value.length === 36 && this.#uuidGenerator.validate(this.value)) || this.value === "")) return this.value;

        const data = new File(
            [
                typeof this.value === 'string' ?
                    new Blob([this.value], { type: 'text/plain' }) :
                    this.value
            ],
            'upload',
            { type: (<Blob | File>this.value).type }
        );

        let types = [data.type];
        // get all endings that are possible for this type
        const endings = MimeTypeUtils.mapMimeTypeToFileEndings(types);
        // get all mimeTypes that are possible for these endings
        endings.forEach((e: string) => types = types.concat(MimeTypeUtils.guessMimeTypeFromFilename(e)));

        let type: string;
        // check if one of the mime types is allowed
        let allowedType = false;
        for (let i = 0; i < types.length; i++) {
            if (this.format?.includes(types[i])) {
                allowedType = true;
                type = types[i];
                break;
            }
        }

        if (!allowedType) {
            const error = new ShapeDiverViewerSessionError(`Parameter(${this.id}).upload: Error uploading FileParameter, type of data (${data.type}) is not a valid type. Has to be ${this.format}.`);
            throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.id}).upload`, error);
        }

        this.#logger.debug(LOGGING_TOPIC.PARAMETER, `Parameter(${this.id}).upload: Uploading FileParameter.`);

        return await this.#sessionEngine.uploadFile(this.id, data, type!)
    }

    // #endregion Public Methods (1)
}