import {
	atobCustom,
	HttpClient,
	type HttpResponse,
} from "@shapediver/viewer.shared.services";
import {type IGLTF_v2} from "@shapediver/viewer.shared.types";

export class BufferLoader {
	// #region Properties (2)

	private readonly _httpClient: HttpClient = HttpClient.instance;
	private readonly _dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/;

	private _loaded: {
		[key: string]: ArrayBuffer;
	} = {};
	private _ranges: {
		[key: string]: {byteOffset: number; byteLength: number};
	} = {};

	// #endregion Properties (2)

	// #region Constructors (1)

	constructor(
		private readonly _content: IGLTF_v2,
		private _body?: ArrayBuffer,
		private _baseUri?: string,
		/** The GLB body is read in place inside the file, not copied out. */
		private _bodyRange?: {byteOffset: number; byteLength: number},
	) {}

	// #endregion Constructors (1)

	// #region Public Methods (2)

	public getBuffer(bufferId: number): ArrayBuffer {
		if (!this._content.buffers)
			throw new Error("BufferLoader.getBuffer: Buffers not available.");
		if (!this._content.buffers[bufferId])
			throw new Error("BufferLoader.getBuffer: Buffer not available.");
		if (!this._loaded[bufferId])
			throw new Error("BufferLoader.getBuffer: Buffer not loaded.");
		return this._loaded[bufferId];
	}

	/**
	 * Where the buffer's bytes are inside {@link getBuffer}. Only the GLB
	 * body starts after offset 0.
	 */
	public getBufferRange(bufferId: number): {
		byteOffset: number;
		byteLength: number;
	} {
		const buffer = this.getBuffer(bufferId);
		return (
			this._ranges[bufferId] ?? {
				byteOffset: 0,
				byteLength: buffer.byteLength,
			}
		);
	}

	public async load(
		skipErrorsForBuffers: Set<number> = new Set(),
	): Promise<void> {
		if (!this._content.buffers) return;

		const promises: Promise<void>[] = [];

		for (let i = 0; i < this._content.buffers.length; i++) {
			const bufferId = i;
			const buffer = this._content.buffers[bufferId];

			if (buffer.type && buffer.type !== "arraybuffer") {
				if (skipErrorsForBuffers.has(bufferId)) continue;
				throw new Error(
					`BufferLoader.load: ${buffer.type} is not supported.`,
				);
			}

			// If present, GLB container is required to be the first buffer.
			if (buffer.uri === undefined && bufferId === 0) {
				if (!this._body) {
					if (skipErrorsForBuffers.has(bufferId)) continue;
					throw new Error("BufferLoader.load: Buffer not available.");
				}
				this._loaded[bufferId] = this._body;
				if (this._bodyRange) this._ranges[bufferId] = this._bodyRange;
				return;
			}
			if (buffer.uri === undefined) {
				if (skipErrorsForBuffers.has(bufferId)) continue;
				throw new Error("BufferLoader.load: Buffer not available.");
			}

			const dataUriRegexResult = buffer.uri!.match(this._dataUriRegex);

			// Safari can not handle Data URIs through XMLHttpRequest so process manually
			if (dataUriRegexResult) {
				try {
					const isBase64 = !!dataUriRegexResult[2];
					let data = dataUriRegexResult[3];
					data = decodeURIComponent(data);
					if (isBase64) data = atobCustom(data);

					const view = new Uint8Array(data.length);
					for (let i = 0; i < data.length; i++) {
						view[i] = data.charCodeAt(i);
					}
					this._loaded[bufferId] = view.buffer;
				} catch (e) {
					if (!skipErrorsForBuffers.has(bufferId)) throw e;
				}
			} else {
				let httpResultPromise = (
					this._httpClient.get(this._baseUri + "/" + buffer.uri!, {
						responseType: "arraybuffer",
					}) as Promise<HttpResponse<ArrayBuffer>>
				).then((response) => {
					this._loaded[bufferId] = response.data;
				});
				if (skipErrorsForBuffers.has(bufferId))
					httpResultPromise = httpResultPromise.catch(
						() => undefined,
					);
				promises.push(httpResultPromise);
			}
		}
		await Promise.all(promises);
	}

	// #endregion Public Methods (2)
}
