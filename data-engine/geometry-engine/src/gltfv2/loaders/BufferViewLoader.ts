import {type IGLTF_v2} from "@shapediver/viewer.shared.types";

import {BufferLoader} from "./BufferLoader";

export interface ILoadedBufferView {
	buffer: ArrayBuffer;
	byteOffset: number;
	byteLength: number;
}

export class BufferViewLoader {
	// #region Properties (1)

	private _loaded: {
		[key: string]: ILoadedBufferView;
	} = {};

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(
		private readonly _content: IGLTF_v2,
		private readonly _bufferLoader: BufferLoader,
	) {}

	// #endregion Constructors (1)

	// #region Public Methods (2)

	public getBufferView(bufferViewId: number): ILoadedBufferView {
		if (!this._content.bufferViews)
			throw new Error(
				"BufferViewLoader.load: BufferViews not available.",
			);
		if (!this._content.bufferViews[bufferViewId])
			throw new Error("BufferViewLoader.load: BufferView not available.");
		if (!this._loaded[bufferViewId])
			throw new Error("BufferViewLoader.load: BufferView not loaded.");
		return this._loaded[bufferViewId];
	}

	public load(skipErrorsForBufferViews: Set<number> = new Set()): void {
		if (!this._content.bufferViews) return;
		for (let i = 0; i < this._content.bufferViews.length; i++) {
			try {
				const bufferViewId = i;
				if (!this._content.bufferViews[bufferViewId])
					throw new Error(
						"BufferViewLoader.load: BufferView not available.",
					);
				const bufferView = this._content.bufferViews[bufferViewId];

				const byteLength = bufferView.byteLength || 0;
				const byteOffset = bufferView.byteOffset || 0;

				if (bufferView.buffer === undefined)
					throw new Error(
						"BufferViewLoader.load: BufferView has no buffer defined.",
					);
				const buffer = this._bufferLoader.getBuffer(bufferView.buffer!);

				this._loaded[bufferViewId] = {
					buffer,
					byteOffset,
					byteLength: Math.min(
						byteLength,
						Math.max(0, buffer.byteLength - byteOffset),
					),
				};
			} catch (e) {
				if (!skipErrorsForBufferViews.has(i)) throw e;
			}
		}
	}

	// #endregion Public Methods (2)
}
