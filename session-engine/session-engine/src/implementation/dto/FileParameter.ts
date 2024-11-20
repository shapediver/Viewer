import * as MimeTypeUtils from '@shapediver/viewer.utils.mime-type';
import { IFileParameter } from '../../interfaces/dto/IFileParameter';
import { Logger, ShapeDiverViewerSessionError, UuidGenerator } from '@shapediver/viewer.shared.services';
import { Parameter } from './Parameter';
import { SessionEngine } from '../SessionEngine';
import { ShapeDiverResponseParameter } from '@shapediver/sdk.geometry-api-sdk-v2';

export class FileParameter extends Parameter<File | Blob | string> implements IFileParameter {
    // #region Properties (3)

    readonly #logger: Logger = Logger.instance;
    readonly #sessionEngine: SessionEngine;
    readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(paramDef: ShapeDiverResponseParameter, sessionEngine: SessionEngine) {
        super(paramDef, sessionEngine);
        this.#sessionEngine = sessionEngine;
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public async getFilename(fileId?: string): Promise<string | undefined> {
        // if fileId is undefined and value is undefined, return undefined
        if (fileId === undefined && this.value === undefined) return;

        // if fileId is undefined and value is a string and is a valid uuid, use the value as fileId
        if (fileId === undefined && typeof this.value === 'string' && ((this.value.length === 36 && this.#uuidGenerator.validate(this.value)) || this.value === ''))
            return (await this.#sessionEngine.getFileInfo(this.id, this.value)).filename;

        // if fileId is undefined, return undefined
        if (fileId === undefined) return;

        return (await this.#sessionEngine.getFileInfo(this.id, fileId)).filename;
    }

    public async upload(v?: File | Blob | string): Promise<string> {
        const value = v !== undefined ? v : this.value;

        if (value === undefined) return this.defval;
        if (typeof value === 'string' && ((value.length === 36 && this.#uuidGenerator.validate(value)) || value === '')) return value;

        // get the type of the file
        let fileType: string | string[];
        if (value instanceof File) {
            // try to get type from file name
            const types = MimeTypeUtils.guessMimeTypeFromFilename(value.name);
            if (value.type === '') {
                if (types.length === 0) {
                    throw new ShapeDiverViewerSessionError(`Parameter(${this.id}).upload: Error uploading FileParameter, provided File has no type and could not be guessed from filename. Has to be ${this.format}.`);
                } else {
                    fileType = types;
                }
            } else {
                fileType = types.concat(value.type);
            }
        } else if (value instanceof Blob) {
            if (value.type === '') {
                throw new ShapeDiverViewerSessionError(`Parameter(${this.id}).upload: Error uploading FileParameter, provided File has no type and could not be guessed from filename. Has to be ${this.format}.`);
            } else {
                fileType = value.type;
            }
        } else {
            fileType = 'text/plain';
        }

        /**
         * Get all possible mime types for the provided fileType.
         */
        let types = typeof fileType === 'string' ? [fileType] : fileType;
        // get all endings that are possible for this type
        const endings = MimeTypeUtils.mapMimeTypeToFileEndings(types);
        // get all mimeTypes that are possible for these endings
        endings.forEach((e: string) => types = types.concat(MimeTypeUtils.guessMimeTypeFromFilename(e)));

        /**
         * Check if the provided fileType is allowed for this parameter.
         * If not, throw an error.
         */
        let type: string | undefined = undefined;
        // check if one of the mime types is allowed
        let allowedType = false;
        for (let i = 0; i < types.length; i++) {
            if (this.format?.includes(types[i])) {
                allowedType = true;
                type = types[i];
                break;
            }
        }

        // if the type is not allowed, throw an error
        if (allowedType === false || type === undefined)
            throw new ShapeDiverViewerSessionError(`Parameter(${this.id}).upload: Error uploading FileParameter, type of data (${fileType}) is not a valid type. Has to be ${this.format}.`);

        // create a File object
        const data = new File(
            [
                typeof value === 'string' ?
                    new Blob([value], { type: 'text/plain' }) :
                    value
            ],
            value instanceof File && value.name !== undefined ? value.name : '',
            { type }
        );

        this.#logger.debug(`Parameter(${this.id}).upload: Uploading FileParameter.`);

        return await this.#sessionEngine.uploadFile(this.id, data, type!);
    }

    // #endregion Public Methods (2)
}