import { container } from 'tsyringe'
import { IGLTF_v2 } from '@shapediver/viewer.data-engine.shared-types'
import { HttpClient } from '@shapediver/viewer.shared.services'

export class BufferLoader {
    // #region Properties (2)

    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);

    private _loaded: {
        [key: string]: ArrayBuffer
    } = {};

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _content: IGLTF_v2, private _body?: ArrayBuffer, private _baseUri?: string) { }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public getBuffer(bufferId: number): ArrayBuffer {
        if (!this._content.buffers) throw new Error('BufferLoader.getBuffer: Buffers not available.')
        if (!this._content.buffers[bufferId]) throw new Error('BufferLoader.getBuffer: Buffer not available.')
        if (!this._loaded[bufferId]) throw new Error('BufferLoader.getBuffer: Buffer not loaded.')
        return this._loaded[bufferId];
    }

    public async load(): Promise<void> {
        if (!this._content.buffers) return;

        let promises: Promise<void>[] = [];

        for (let i = 0; i < this._content.buffers.length; i++) {
            const bufferId = i;
            const buffer = this._content.buffers[bufferId];

            if (buffer.type && buffer.type !== 'arraybuffer') {
                throw new Error(`BufferLoader.load: ${buffer.type} is not supported.`);
            }

            // If present, GLB container is required to be the first buffer.
            if (buffer.uri === undefined && bufferId === 0) {
                if (!this._body) throw new Error(`BufferLoader.load: Buffer not available.`);
                this._loaded[bufferId] = this._body;
                return;
            }

            const dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/;
            const dataUriRegexResult = buffer.uri!.match(dataUriRegex);

            // Safari can not handle Data URIs through XMLHttpRequest so process manually
            if (dataUriRegexResult) {
                const isBase64 = !!dataUriRegexResult[2];
                let data = dataUriRegexResult[3];
                data = decodeURIComponent(data);
                if (isBase64) data = atob(data);

                const view = new Uint8Array(data.length);
                for (let i = 0; i < data.length; i++) {
                    view[i] = data.charCodeAt(i);
                }
                this._loaded[bufferId] = view.buffer;
            } else {
                let httpResultPromise = this._httpClient.get(this._baseUri + '/' + buffer.uri!, {
                    responseType: 'arraybuffer'
                }).then(response => { this._loaded[bufferId] = response.data; });
                promises.push(httpResultPromise)
            }
        }
        await Promise.all(promises);
    }

    // #endregion Public Methods (2)
}
