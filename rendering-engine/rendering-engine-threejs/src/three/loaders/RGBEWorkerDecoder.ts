/**
 * Radiance (.hdr) decoding off the main thread.
 *
 * One worker per page, started by the first .hdr load and built from the
 * decoder's own source (a blob URL, so consumers configure nothing in Vite
 * or webpack). Where a worker cannot be created, does not start or cannot
 * receive the file (no Worker, a CSP without `worker-src blob:`), the file
 * is decoded on the main thread with the same function and the same result.
 */
import {decodeRgbeBuffer, IDecodedRgbe} from "./decodeRgbeBuffer";

/**
 * The worker's message loop. Runs in the worker, so it must reference
 * nothing outside itself (see {@link decodeRgbeBuffer}).
 */
function rgbeWorkerMain(
	scope: any,
	decode: (buffer: ArrayBuffer) => IDecodedRgbe | {error: string},
): void {
	scope.onmessage = function (event: MessageEvent) {
		const data = event.data;
		let result: IDecodedRgbe | {error: string};
		try {
			result = decode(data.buffer);
		} catch (error: any) {
			result = {
				error: error && error.message ? error.message : String(error),
			};
		}
		if ("error" in result) {
			scope.postMessage({id: data.id, error: result.error});
		} else {
			scope.postMessage({id: data.id, result: result}, [
				result.data.buffer,
			]);
		}
	};
	scope.postMessage({ready: true});
}

interface IPendingRequest {
	resolve: (result: IDecodedRgbe) => void;
	reject: (error: Error) => void;
	retry: () => void;
}

class RGBEWorkerDecoder {
	// #region Properties (5)

	private _nextId = 0;
	private readonly _pending = new Map<number, IPendingRequest>();
	private _worker?: Worker;
	private _workerFailed = false;
	private _workerReady?: Promise<boolean>;

	// #endregion Properties (5)

	// #region Public Methods (1)

	/**
	 * Decode a Radiance file. The buffer is copied once for the worker and
	 * never transferred, so a cached HTTP response stays usable.
	 * Rejects for a file that is not a valid Radiance file.
	 */
	public decode(buffer: ArrayBuffer): Promise<IDecodedRgbe> {
		return this.startWorker().then((ready) =>
			ready
				? this.decodeInWorker(buffer)
				: this.decodeOnMainThread(buffer),
		);
	}

	// #endregion Public Methods (1)

	// #region Private Methods (5)

	private decodeInWorker(buffer: ArrayBuffer): Promise<IDecodedRgbe> {
		return new Promise((resolve, reject) => {
			const id = this._nextId++;
			const request: IPendingRequest = {
				resolve,
				reject,
				retry: () =>
					this.decodeOnMainThread(buffer).then(resolve, reject),
			};
			this._pending.set(id, request);
			try {
				const copy = buffer.slice(0);
				this._worker!.postMessage({id, buffer: copy}, [copy]);
			} catch {
				// the file cannot be sent (DataCloneError): decode this one here,
				// and every later one too
				this._pending.delete(id);
				this.failWorker();
				request.retry();
			}
		});
	}

	private decodeOnMainThread(buffer: ArrayBuffer): Promise<IDecodedRgbe> {
		try {
			const result = decodeRgbeBuffer(buffer);
			if ("error" in result)
				return Promise.reject(new Error(result.error));
			return Promise.resolve(result);
		} catch (e) {
			return Promise.reject(
				e instanceof Error ? e : new Error(String(e)),
			);
		}
	}

	private failWorker(): void {
		this._workerFailed = true;
		this._worker?.terminate();
		this._worker = undefined;
		// requests already sent decode on the main thread instead
		const pending = [...this._pending.values()];
		this._pending.clear();
		pending.forEach((request) => request.retry());
	}

	private onMessage(data: {
		id?: number;
		result?: IDecodedRgbe;
		error?: string;
	}): void {
		if (!data || data.id === undefined) return;
		const request = this._pending.get(data.id);
		if (!request) return;
		this._pending.delete(data.id);
		if (data.error !== undefined) request.reject(new Error(data.error));
		else request.resolve(data.result!);
	}

	private startWorker(): Promise<boolean> {
		if (this._workerFailed) return Promise.resolve(false);
		if (this._workerReady) return this._workerReady;

		this._workerReady = new Promise<boolean>((resolve) => {
			let url: string | undefined;
			let started = false;
			const fail = () => {
				if (!started && url) URL.revokeObjectURL(url);
				this.failWorker();
				resolve(false);
			};
			try {
				if (
					typeof Worker === "undefined" ||
					typeof Blob === "undefined" ||
					typeof URL === "undefined" ||
					typeof URL.createObjectURL !== "function"
				)
					throw new Error("Workers are not available.");
				// A minifier with keepNames wraps functions in __name(...), a
				// helper the worker scope does not have.
				const source =
					"var __name = function (f) { return f; };\n(" +
					rgbeWorkerMain.toString() +
					")(self, " +
					decodeRgbeBuffer.toString() +
					");";
				url = URL.createObjectURL(
					new Blob([source], {type: "text/javascript"}),
				);
				const worker = new Worker(url);
				this._worker = worker;
				worker.onmessage = (event: MessageEvent) => {
					const data = event.data;
					if (data && data.ready) {
						started = true;
						if (url) URL.revokeObjectURL(url);
						resolve(true);
					} else {
						this.onMessage(data);
					}
				};
				worker.onerror = (event: ErrorEvent) => {
					event.preventDefault();
					fail();
				};
			} catch {
				fail();
			}
		});
		return this._workerReady;
	}

	// #endregion Private Methods (5)
}

let instance: RGBEWorkerDecoder | undefined;

/** The decoder shared by every .hdr load on the page. */
export function getRgbeDecoder(): RGBEWorkerDecoder {
	if (!instance) instance = new RGBEWorkerDecoder();
	return instance;
}
