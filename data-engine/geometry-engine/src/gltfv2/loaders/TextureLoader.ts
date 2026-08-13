import {ResErrorType, ResponseError} from "@shapediver/sdk.geometry-api-sdk-v2";
import {type IGLTF_v2} from "@shapediver/viewer.data-engine.shared-types";
import {
	EventEngine,
	EVENTTYPE_SESSION,
	hashForArraySampled,
	HttpClient,
	Logger,
	ShapeDiverGeometryBackendResponseError,
} from "@shapediver/viewer.shared.services";

import {SDImageBitmap} from "@shapediver/viewer.shared.types/dist/types";
import {BufferViewLoader} from "./BufferViewLoader";

export class TextureLoader {
	// #region Properties (3)

	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _httpClient: HttpClient = HttpClient.instance;
	private readonly _logger: Logger = Logger.instance;

	private _loaded: {
		[key: string]: {
			image: HTMLImageElement | SDImageBitmap | ArrayBuffer;
			blob: Blob;
		};
	} = {};

	// #endregion Properties (3)

	// #region Constructors (1)

	constructor(
		private readonly _content: IGLTF_v2,
		private readonly _bufferViewLoader: BufferViewLoader,
		private _baseUri?: string,
		private readonly _sessionId?: string,
	) {}

	// #endregion Constructors (1)

	// #region Public Methods (2)

	public getTexture(textureId: number):
		| {
				image: HTMLImageElement | SDImageBitmap | ArrayBuffer;
				blob: Blob;
		  }
		| undefined {
		if (!this._content.textures || !this._content.textures[textureId]) {
			this.reportTextureError(
				new ResponseError(
					0,
					`TextureLoader.getTexture: Texture ${textureId} is not available.`,
					"Loading the model without this texture.",
					ResErrorType.TEXTURE_URL_ERROR,
				),
			);
			return;
		}
		return this._loaded[textureId];
	}

	public async load(): Promise<void> {
		if (!this._content.textures) return;
		if (!this._content.images) {
			const error = new ResponseError(
				0,
				"TextureLoader.load: Images are not available.",
				"Loading the model without textures.",
				ResErrorType.TEXTURE_URL_ERROR,
			);
			this.reportTextureError(error);
			return;
		}

		const promises: Promise<void>[] = [];
		for (let i = 0; i < this._content.textures.length; i++) {
			const textureId = i;
			const texture = this._content.textures[textureId];
			const image = this._content.images[texture.source];
			if (!image) {
				this.reportTextureError(
					new ResponseError(
						0,
						`TextureLoader.load: Image ${texture.source} for texture ${textureId} is not available.`,
						"Loading the model without this texture.",
						ResErrorType.TEXTURE_URL_ERROR,
					),
				);
				continue;
			}

			const DATA_URI_REGEX = /^data:(.*?)(;base64)?,(.*)$/;
			const HTTPS_URI_REGEX = /^https:\/\//;

			if (image.bufferView !== undefined) {
				try {
					const bufferView = this._bufferViewLoader.getBufferView(
						image.bufferView,
					);
					const dataView = new DataView(bufferView);
					const array: Array<number> = [];
					for (let i = 0; i < dataView.byteLength; i += 1)
						array[i] = dataView.getUint8(i);

					const uint8Array = new Uint8Array(array);
					const blob = new Blob([uint8Array], {
						type: image.mimeType,
					});

					// Use createImageBitmap for better performance
					promises.push(
						new Promise<void>((resolve, reject) => {
							if (typeof createImageBitmap !== "undefined") {
								createImageBitmap(blob, {
									premultiplyAlpha: "none",
								})
									.then((imageBitmap) => {
										const sdImageBitmap: SDImageBitmap =
											imageBitmap as SDImageBitmap;

										// create a unique id for the image bitmap depending on its content
										sdImageBitmap.id =
											hashForArraySampled(uint8Array);

										this._loaded[textureId] = {
											image: sdImageBitmap,
											blob,
										};
										resolve();
									})
									.catch(reject);
							} else {
								// Fallback to Image for older browsers
								const dataUri = URL.createObjectURL(blob);
								const img = new Image();
								img.onload = () => {
									this._loaded[textureId] = {
										image: img,
										blob,
									};
									URL.revokeObjectURL(dataUri);
									resolve();
								};
								img.onerror = (e) => {
									URL.revokeObjectURL(dataUri);
									reject(e);
								};
								img.crossOrigin = "anonymous";
								img.src = dataUri;
							}
						}),
					);
				} catch (e) {
					promises.push(Promise.reject(e));
				}
			} else {
				const url =
					DATA_URI_REGEX.test(image.uri!) ||
					HTTPS_URI_REGEX.test(image.uri!)
						? image.uri
						: `${this._baseUri}/${image.uri}`;
				promises.push(
					new Promise<void>((resolve, reject) => {
						this._httpClient
							.loadTexture(url!)
							.then((response) => {
								if (!response) {
									resolve();
								} else {
									if (response.data.image) {
										this._loaded[textureId] = {
											image: response.data.image,
											blob: response.data.blob,
										};
									} else {
										this._loaded[textureId] = {
											image: response.data.buffer,
											blob: response.data.blob,
										};
									}
									resolve();
								}
							})
							.catch((e) => reject(e));
					}),
				);
			}
		}

		const results = await Promise.allSettled(promises);
		for (const result of results) {
			if (result.status === "rejected") {
				const reason =
					result.reason instanceof Error
						? result.reason.message
						: String(result.reason);
				const error: ResponseError =
					result.reason instanceof
					ShapeDiverGeometryBackendResponseError
						? new ResponseError(
								result.reason.status,
								result.reason.message,
								result.reason.desc,
								ResErrorType.TEXTURE_URL_ERROR,
							)
						: new ResponseError(
								0,
								reason,
								"Loading the model without this texture.",
								ResErrorType.TEXTURE_URL_ERROR,
							);
				this.reportTextureError(error);
			}
		}
	}

	// #endregion Public Methods (2)

	private reportTextureError(error: Error): void {
		this._logger.error(
			`${error.message} ${error instanceof ResponseError ? error.description : "Loading the model without this texture."}`,
		);
		if (this._sessionId)
			this._eventEngine.emitEvent(EVENTTYPE_SESSION.SESSION_ERROR, {
				sessionId: this._sessionId,
				error,
			});
	}
}
