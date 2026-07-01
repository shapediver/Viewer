import {
	processError,
	RequestError,
	ResponseError,
	SdGeometryError as ShapeDiverBackendError,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import axios, {AxiosRequestConfig} from "axios";
import {Converter} from "../converter/Converter";
import {Logger} from "../logger/Logger";
import {
	ShapeDiverGeometryBackendError,
	ShapeDiverGeometryBackendRequestError,
	ShapeDiverGeometryBackendResponseError} from "../logger/ShapeDiverBackendErrors";
import {btoaCustom} from "../utilities/base64";
import {type HttpResponse} from "./HttpResponse";

export class HttpClient {
	// #region Properties (7)

	private readonly _logger: Logger = Logger.instance;

	private static _instance: HttpClient;

	private _dataCache: Map<
		string,
		{
			value: Promise<HttpResponse<unknown>>;
			timestamp: number;
			resolved: boolean;
			size?: number;
		}
	> = new Map();
	private _enableCaching: boolean = true;
	private _excludedQueryParameters: string[] = [
		"Expires",
		"Signature",
		"Key-Pair-Id",
	];
	private _maxCacheSize: number = 1024 * 1024 * 32;
	private _sessionLoading: {
		[key: string]: {
			getAsset: (url: string) => Promise<[ArrayBuffer, string]>;
			downloadTexture: (url: string) => Promise<[ArrayBuffer, string]>;
		};
	} = {};

	// #endregion Properties (7)

	// #region Constructors (1)

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	// #endregion Constructors (1)

	// #region Public Static Getters And Setters (1)

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	// #endregion Public Static Getters And Setters (1)

	// #region Public Getters And Setters (6)

	public get enableCaching(): boolean {
		return this._enableCaching;
	}

	public set enableCaching(value: boolean) {
		this._enableCaching = value;
		if (this._enableCaching === false) this._dataCache.clear();
	}

	public get excludedQueryParameters(): string[] {
		return this._excludedQueryParameters;
	}

	public set excludedQueryParameters(value: string[]) {
		this._excludedQueryParameters = value;
	}

	public get maxCacheSize(): number {
		return this._maxCacheSize;
	}

	public set maxCacheSize(value: number) {
		this._maxCacheSize = value;
	}

	// #endregion Public Getters And Setters (6)

	// #region Public Methods (5)

	/**
	 * Add the data loading options from a session.
	 *
	 * @param sessionId
	 * @param callbacks
	 */
	public addDataLoading(
		sessionId: string,
		callbacks: {
			getAsset: (url: string) => Promise<[ArrayBuffer, string]>;
			downloadTexture: (url: string) => Promise<[ArrayBuffer, string]>;
		},
	) {
		this._sessionLoading[sessionId] = callbacks;
	}

	/**
	 * Maps the geometry backend error to the corresponding viewer errors:
	 * - ResError is mapped to ShapeDiverGeometryBackendResponseError
	 * - ReqError is mapped to ShapeDiverGeometryBackendRequestError
	 *
	 * Other error types are thrown as is.
	 *
	 * @param e
	 */
	public async convertError(err: ShapeDiverBackendError | Error | unknown) {
		const e = err instanceof Error ? await processError(err) : err;

		let convertedError = e;
		if (e instanceof ResponseError) {
			convertedError = new ShapeDiverGeometryBackendResponseError(
				e.message,
				e.status,
				e.type,
				e.description,
			);
		} else if (e instanceof RequestError) {
			convertedError = new ShapeDiverGeometryBackendRequestError(
				e.message,
			);
		} else if (e instanceof ShapeDiverBackendError) {
			convertedError = new ShapeDiverGeometryBackendError(e.message);
		}

		return convertedError;
	}

	/**
	 * Get the requested resource either as a download or from the cache.
	 * If available, the registered session loading is used for download.
	 * Textures are downloaded via a specific endpoint and can be converted in this step as well.
	 * Depending on the provided caching options, the requested resource might already be cached.
	 *
	 * @param href
	 * @param config
	 * @param textureLoading
	 * @param textureConversion
	 * @returns
	 */
	public async get(
		href: string,
		config: AxiosRequestConfig = {responseType: "arraybuffer"},
		textureLoading: boolean = false,
	): Promise<HttpResponse<unknown>> {
		const dataKey = this.hrefToDataKey(href);

		// return element if it exists in cache
		if (this._dataCache.has(dataKey)) return this.getFromCache(dataKey);

		// try to get sessionId from href
		let sessionId = this.getSessionId(href);

		// if href does not have sessionId, use the first session, if available
		if (!sessionId && Object.keys(this._sessionLoading).length > 0)
			sessionId = Object.keys(this._sessionLoading)[0];

		// get the session loading functions, if available
		let sessionLoading:
			| {
					getAsset: (url: string) => Promise<[ArrayBuffer, string]>;
					downloadTexture: (
						url: string,
					) => Promise<[ArrayBuffer, string]>;
			  }
			| undefined;
		if (sessionId) sessionLoading = this._sessionLoading[sessionId];

		let loadingPromise;

		// separation texture vs everything else
		if (textureLoading) {
			// if we have a sessionId and the sessionLoading functions and the image is not a blob or data, we load it via the sdk
			if (
				sessionLoading !== undefined &&
				sessionId !== undefined &&
				!href.startsWith("blob:") &&
				!href.startsWith("data:")
			) {
				// take first session to load a texture that is not session related
				loadingPromise = new Promise<HttpResponse<ArrayBuffer>>(
					(resolve, reject) => {
						sessionLoading!
							.downloadTexture(href)
							.then(async (result) => {
								resolve({
									data: result[0],
									headers: {
										"content-type": result[1],
									},
								});
							})
							.catch(() => {
								// if this fails (e.g., external URLs not belonging to this session), fall back to direct download
								const axiosPromise = axios(
									href,
									Object.assign({method: "get"}, config),
								);
								axiosPromise.catch((e) => reject(e));
								resolve(axiosPromise);
							});
					},
				).catch(async (e) => {
					throw await this.convertError(e);
				});
			} else {
				// we can load blobs and data urls directly
				// or load it directly if we don't have a session
				loadingPromise = axios(
					href,
					Object.assign({method: "get"}, config),
				)
					.then(async (result) => {
						return result;
					})
					.catch(async (e) => {
						throw await this.convertError(e);
					});
			}
		} else {
			if (!sessionLoading) {
				// if there is no session to load from, we use the fallback option
				loadingPromise = axios(
					href,
					Object.assign({method: "get"}, config),
				).catch(async (e) => {
					throw await this.convertError(e);
				});
			} else {
				// all data links where we could somehow find a session to load it with
				loadingPromise = new Promise<HttpResponse<ArrayBuffer>>(
					(resolve, reject) => {
						sessionLoading!
							.getAsset(href)
							.then((result) => {
								resolve({
									data: result[0],
									headers: {
										"content-type": result[1],
									},
								});
							})
							.catch(() => {
								// if this fails, we just load it directly
								const axiosPromise = axios(
									href,
									Object.assign({method: "get"}, config),
								);
								axiosPromise.catch((e) => reject(e));
								resolve(axiosPromise);
							});
					},
				).catch(async (e) => {
					throw await this.convertError(e);
				});
			}
		}

		if (this.enableCaching) this.addToCache(dataKey, loadingPromise);

		return loadingPromise;
	}

	/**
	 * Get the requested texture either as a download or from the cache.
	 * If the texture is not available, undefined is returned.
	 *
	 * @param href The URL of the texture to load.
	 * @returns Either the texture as a buffer and blob or undefined if the texture could not be loaded.
	 */
	public async loadTexture(href: string): Promise<
		HttpResponse<{
			image?: HTMLImageElement;
			buffer: ArrayBuffer;
			blob: Blob;
		}>
	> {
		const dataKey = this.hrefToDataKey(href);

		// return element if it exists in cache
		if (this._dataCache.has(dataKey))
			return this.getFromCache(dataKey) as Promise<
				HttpResponse<{
					image?: HTMLImageElement;
					buffer: ArrayBuffer;
					blob: Blob;
				}>
			>;
		let loadingPromise = (
			this.get(href, undefined, true) as Promise<
				HttpResponse<ArrayBuffer>
			>
		)
			.then(async (response) => {
				const buffer = response.data;
				const arrayBufferView = new Uint8Array(response.data);
				const blob = new Blob([arrayBufferView], {
					type: response.headers["content-type"],
				});

				if (typeof window !== "undefined") {
					const image = await Converter.instance.responseToImage({
						data: {
							buffer,
							blob,
						},
						size: response.data.byteLength,
						headers: response.headers,
					});

					return {
						data: {
							image,
							buffer,
							blob,
						},
						size: response.data.byteLength,
						headers: response.headers,
					};
				} else {
					return {
						data: {
							buffer,
							blob,
						},
						size: response.data.byteLength,
						headers: response.headers,
					};
				}
			})
			.catch(async (e) => {
				throw await this.convertError(e);
			});

		// add the result to the cache
		this.addToCache(dataKey, loadingPromise);

		// return undefined if the texture could not be loaded
		// that way the loading can be continued without the texture
		return loadingPromise as Promise<
			HttpResponse<{
				image?: HTMLImageElement;
				buffer: ArrayBuffer;
				blob: Blob;
			}>
		>;
	}

	/**
	 * Add the data loading options from a session.
	 *
	 * @param sessionId
	 */
	public removeDataLoading(sessionId: string) {
		delete this._sessionLoading[sessionId];
	}

	// #endregion Public Methods (5)

	// #region Private Methods (5)

	/**
	 * Add
	 *
	 * @param key
	 * @param value
	 */
	private addToCache(key: string, value: Promise<HttpResponse<unknown>>) {
		// Remove items from the cache until the cache size is smaller than the maximum cache size.
		// Only resolved promises are evaluated, as unresolved promises don't add any size.
		let oldestKey: string | undefined = this._dataCache.keys().next().value;
		while (this.calculateCacheSize() >= this._maxCacheSize && oldestKey) {
			// Remove the oldest entry if the cache is full
			this._dataCache.delete(oldestKey);
			oldestKey = this._dataCache.keys().next().value;
		}

		const timestamp = Date.now();
		this._dataCache.set(key, {value, timestamp, resolved: false});

		// once the promise resolves, set resolved and size properties
		value
			.then((promiseResult) => {
				const size = promiseResult.size
					? promiseResult.size
					: (promiseResult.data as ArrayBuffer).byteLength;
				this._dataCache.set(key, {
					value,
					timestamp,
					resolved: true,
					size,
				});
			})
			.catch(() => {
				// Rejection is handled by the caller; suppress unhandled rejection on this branch.
			});
	}

	/**
	 * Calculate the current cache size from all resolved promises.
	 *
	 * @returns
	 */
	private calculateCacheSize() {
		let size = 0;
		this._dataCache.forEach((value) => {
			if (value.resolved === true) size += value.size!;
		});
		return size;
	}

	/**
	 * Get the value of an object from the cache.
	 *
	 * @param key
	 * @returns
	 */
	private getFromCache(key: string): Promise<HttpResponse<unknown>> {
		const cachedObject = this._dataCache.get(key)!;
		this._dataCache.set(key, {
			value: cachedObject.value,
			timestamp: Date.now(),
			resolved: cachedObject.resolved,
			size: cachedObject.size,
		});
		return cachedObject.value;
	}

	/**
	 * Get the session id of the provided href.
	 *
	 * @param href
	 * @returns
	 */
	private getSessionId(href: string): string | undefined {
		// searching for "/session/SESSION_ID/{'output' | 'export' | 'texture'}/ASSET_DATA"
		const parts = href.split("/");
		const sessionPartIndex = parts.indexOf("session");

		// There have to be at exactly 4 parts, including the session
		if (sessionPartIndex !== -1 && parts.length === sessionPartIndex + 4) {
			const sessionId = parts[sessionPartIndex + 1];
			// no such session has been registered, should never happen
			if (!this._sessionLoading[sessionId]) return;
			return sessionId;
		}
		return;
	}

	/**
	 * Convert the provided href to a data cache key.
	 * In this conversion the excludedQueryParameters are removed from the href.
	 *
	 * @param href
	 * @returns
	 */
	private hrefToDataKey(href: string) {
		const url = new URL(href);

		// Create a URLSearchParams object from the existing query parameters
		const params = new URLSearchParams(url.search);

		for (let i = 0; i < this._excludedQueryParameters.length; i++)
			// Remove specific query parameters
			params.delete(this._excludedQueryParameters[i]);

		// Reconstruct the URL with the modified query parameters
		url.search = params.toString();

		const hrefAsKey = url.toString();
		return btoaCustom(hrefAsKey);
	}

	// #endregion Private Methods (5)
}
