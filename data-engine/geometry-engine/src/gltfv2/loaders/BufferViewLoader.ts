import { IGLTF_v2 } from '@shapediver/viewer.data-engine.shared-types'

import { BufferLoader } from './BufferLoader'

export class BufferViewLoader {
    // #region Properties (1)

    private _loaded: {
        [key: string]: ArrayBuffer
    } = {};

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(private readonly _content: IGLTF_v2, private readonly _bufferLoader: BufferLoader) { }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public getBufferView(bufferViewId: number): ArrayBuffer {
        if (!this._content.bufferViews) throw new Error('BufferViewLoader.load: BufferViews not available.')
        if (!this._content.bufferViews[bufferViewId]) throw new Error('BufferViewLoader.load: BufferView not available.')
        if (!this._loaded[bufferViewId]) throw new Error('BufferViewLoader.load: BufferView not loaded.')
        return this._loaded[bufferViewId];
    }

    public load(): void {
        if (!this._content.bufferViews) return;
        for (let i = 0; i < this._content.bufferViews.length; i++) {
            const bufferViewId = i;
            if (!this._content.bufferViews[bufferViewId]) throw new Error('BufferViewLoader.load: BufferView not available.')
            const bufferView = this._content.bufferViews[bufferViewId];

            const byteLength = bufferView.byteLength || 0;
            const byteOffset = bufferView.byteOffset || 0;

            if (bufferView.buffer === undefined) throw new Error('BufferViewLoader.load: BufferView has no buffer defined.')
            const buffer = this._bufferLoader.getBuffer(bufferView.buffer!);
            const result = buffer.slice(byteOffset, byteOffset + byteLength);

            this._loaded[bufferViewId] = result;
        }
    }

    // #endregion Public Methods (2)
}
