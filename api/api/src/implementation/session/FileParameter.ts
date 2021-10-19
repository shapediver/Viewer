import { ShapeDiverResponseParameter } from '@shapediver/api.geometry-api-dto-v1'
import { Session } from '@shapediver/viewer.session-engine.session-engine'
import { HttpClient, Logger, LOGGINGTOPIC, MimeTypeUtils, SDError, UuidGenerator } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { IFileParameter } from '../../interfaces/session/IFileParameter'
import { ISession } from '../../interfaces/session/ISession'
import { Parameter } from './Parameter'

export class FileParameter extends Parameter<File | Blob | string> implements IFileParameter {
    // #region Properties (5)

    readonly #httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
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
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.id}).constructor: Something unexpected happened.`, true)
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
                const error = new SDError(`Parameter(${this.id}).upload: Error uploading FileParameter, file size was 0.`);
                this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                throw error;
            }

            let types = [data.type];
            // get all endings that are possible for this type
            const endings = this.#mimeTypeUtils.mapMimeTypeToFileEndings(types);
            // get all mimeTypes that are possible for these endings
            endings.forEach((e: string) => types = types.concat(this.#mimeTypeUtils.guessMimeTypeFromFilename(e)));

            let type;
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
                const error = new SDError(`Parameter(${this.id}).upload: Error uploading FileParameter, type of data (${data.type}) is not a valid type. Has to be ${this.format}.`);
                this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                throw error;
            }

            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).upload: Uploading FileParameter.`);
            try {
                let uploadReply = (
                        await this.#sessionEngine.sessionCommunication(
                            this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'upload')[0].href!, 
                            this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'upload')[0].method!.toLowerCase()!, 
                            { [this.id]: { size: data.size, format: type } }, 
                            'application/json'
                        )
                    ).data;
                this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).upload: Received reply ${JSON.stringify(uploadReply)}.`);
                await this.#httpClient.put(uploadReply[this.id].href, { data, headers: { 'Content-Type': type }, });
                return uploadReply[this.id].id;
            } catch (e) {
                if (e.response && e.response.status) {
                    throw this.#logger.httpError(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.id}).upload: Upload failed.`, e.response.status, true);
                } else {
                    throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.id}).upload: Upload failed.`, true);
                }
            }
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.id}).upload: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Methods (1)
}