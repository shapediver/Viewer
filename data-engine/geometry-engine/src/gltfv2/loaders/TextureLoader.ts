import { IGLTF_v2 } from '@shapediver/viewer.data-engine.shared-types'
import { Converter, HttpClient, HttpResponse } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { BufferViewLoader } from './BufferViewLoader'

export class TextureLoader {
    // #region Properties (4)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);

    private _loaded: {
        [key: string]: HTMLImageElement
    } = {};

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(private readonly _content: IGLTF_v2, private readonly _bufferViewLoader: BufferViewLoader, private _baseUri?: string) { }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public getTexture(textureId: number): HTMLImageElement {
        if (!this._content.textures) throw new Error('TextureLoader.getTexture: Textures not available.')
        if (!this._content.textures[textureId]) throw new Error('TextureLoader.getTexture: Texture not available.')
        if (!this._loaded[textureId]) throw new Error('TextureLoader.getTexture: Texture not loaded.')
        return this._loaded[textureId];
    }

    public async load(): Promise<void> {
        if (!this._content.textures) return;

        let promises: Promise<void>[] = [];
        for(let i = 0; i < this._content.textures.length; i++) {
            const textureId = i;
            const texture = this._content.textures[textureId];
            if (!this._content.images) throw new Error('TextureLoader.load: Images not available.')
            const image = this._content.images[texture.source];
    
            const DATA_URI_REGEX = /^data:(.*?)(;base64)?,(.*)$/;
            const HTTPS_URI_REGEX = /^https:\/\//;
    
            if (image.bufferView !== undefined) {
                const bufferView = this._bufferViewLoader.getBufferView(image.bufferView);
                const dataView = new DataView(bufferView);
                const array: Array<number> = [];
                for (let i = 0; i < dataView.byteLength; i += 1)
                    array[i] = dataView.getUint8(i);
    
                const blob = new Blob([new Uint8Array(array)], { type: image.mimeType });
                const dataUri = window.URL.createObjectURL(blob);
    
                promises.push(
                    new Promise<void>(resolve => {
                        this._httpClient.loadTexture(dataUri)
                            .then(response => {
                                this._converter.responseToImage(response).then(img => {
                                    this._loaded[textureId] = img;
                                    resolve()
                                });
                            })
                    })
                );
            } else {
                const url = DATA_URI_REGEX.test(image.uri!) || HTTPS_URI_REGEX.test(image.uri!) ? image.uri : `${this._baseUri}/${image.uri}`;
                promises.push(
                    new Promise<void>(resolve => {
                        this._httpClient.loadTexture(url!)
                            .then(response => {
                                this._converter.responseToImage(response).then(img => {
                                    this._loaded[textureId] = img;
                                    resolve()
                                });
                            })
                    })
                );
            }
        }

        await Promise.all(promises);
    }

    // #endregion Public Methods (2)
}