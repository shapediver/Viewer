import { ShapeDiverResponseParameter } from '@shapediver/sdk.geometry-api-sdk-v2'
import { Session } from '@shapediver/viewer.session-engine.session-engine'
import { Logger, LOGGINGTOPIC, MimeTypeUtils, ShapeDiverBackendError, ShapeDiverViewerError, ShapeDiverViewerSessionError, UuidGenerator } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { IFileParameter } from '../../interfaces/session/IFileParameter'
import { ISession } from '../../interfaces/session/ISession'
import { Parameter } from './Parameter'

export class FileParameter extends Parameter<File | Blob | string> implements IFileParameter {
    // #region Properties (5)

    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #mimeTypeUtils: MimeTypeUtils = <MimeTypeUtils>container.resolve(MimeTypeUtils);
    readonly #session: ISession;
    readonly #sessionEngine: Session;
    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(session: ISession, sessionEngine: Session, paramDef: ShapeDiverResponseParameter) {
        super(session, sessionEngine, paramDef);
        try {
            this.#session = session;
            this.#sessionEngine = sessionEngine;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).constructor`, e);
        }
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public async upload() {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).upload: Uploading FileParameter with value ${this.value}.`);
            if (!this.value) return this.defval;
            if (typeof this.value === 'string' && this.value.length === 36 && this.#uuidGenerator.validate(this.value)) return this.value;
            
            const data = new File(
                [
                    typeof this.value === 'string' ? 
                        new Blob([this.value], { type: 'text/plain' }) : 
                        this.value
                ], 
                'upload', 
                { type: (<Blob|File>this.value).type }
            );

            if (data.size === 0) {
                const error = new ShapeDiverViewerSessionError(`Parameter(${this.id}).upload: Error uploading FileParameter, file size was 0.`);
                throw this.#logger.handleError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).upload`, error);
            }

            let types = [data.type];
            // get all endings that are possible for this type
            const endings = this.#mimeTypeUtils.mapMimeTypeToFileEndings(types);
            // get all mimeTypes that are possible for these endings
            endings.forEach((e: string) => types = types.concat(this.#mimeTypeUtils.guessMimeTypeFromFilename(e)));

            let type: string;
            // check if one of the mime types is allowed
            let allowedType = false;
            for(let i = 0; i < types.length; i++) {
                if(this.format?.includes(types[i])) {
                    allowedType = true;
                    type = types[i];
                    break;
                }
            }

            if(!allowedType) {
                const error = new ShapeDiverViewerSessionError(`Parameter(${this.id}).upload: Error uploading FileParameter, type of data (${data.type}) is not a valid type. Has to be ${this.format}.`);
                throw this.#logger.handleError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).upload`, error);
            }

            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).upload: Uploading FileParameter.`);

            return await this.#sessionEngine.uploadFile(this.id, data, type!)
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).upload`, e);
        }
    }

    // #endregion Public Methods (1)
}