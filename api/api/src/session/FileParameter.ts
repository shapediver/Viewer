import { ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v1";
import { Session } from "@shapediver/viewer.session-engine.session-engine";
import { SDError } from "@shapediver/viewer.shared.utils";
import { Logger, LOGGINGTOPIC } from "@shapediver/viewer.shared.utils";
import { HttpClient, InputValidator, UuidGenerator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Parameter } from "./Parameter";

export class FileParameter extends Parameter<File | Blob | string> {
    // #region Properties (5)

    readonly #httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #sessionEngine: Session;
    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(sessionEngine: Session, paramDef: ShapeDiverResponseParameter) {
        super(sessionEngine, paramDef);
        try {
            this.#sessionEngine = sessionEngine;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${this.id}).constructor: Something unexpected happened.`, true)
        }
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public async upload() {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).upload: Uploading FileParameter with value ${this.value}.`);
            if (!this.value) return this.defval;
            if (typeof this.value === 'string' && this.value.length === 36 && this.#uuidGenerator.validate(this.value)) return this.value;
            const data = new File([typeof this.value === 'string' ? new Blob([this.value], { type: 'text/plain' }) : this.value], 'upload');
            if (data.size === 0)
                this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(`Parameter(${this.id}).upload: Error uploading FileParameter, file size was 0.`));

            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).upload: Uploading FileParameter.`);
            try {
                let uploadReply = (await this.#sessionEngine.sessionCommunication(this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'upload')[0].href!, this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'upload')[0].method!.toLowerCase()!, { [this.id]: { size: data.size, format: this.format![0] } }, 'application/json')).data;
                this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).upload: Received reply ${JSON.stringify(uploadReply)}.`);
                await this.#httpClient.put(uploadReply[this.id].href, { data, headers: { 'Content-Type': this.format![0] }, });
                return uploadReply[this.id].id;
            } catch (e) {
                if (e.response && e.response.status) {
                    throw this.#logger.httpError(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${this.id}).upload: Upload failed.`, e.response.status, true);
                } else {
                    throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${this.id}).upload: Upload failed.`, true);
                }
            }
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${this.id}).upload: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Methods (1)
}