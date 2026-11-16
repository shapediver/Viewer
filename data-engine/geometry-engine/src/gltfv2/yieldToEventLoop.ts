/**
 * Let the browser paint and handle input before conversion continues.
 *
 * `scheduler.yield()` resumes ahead of other queued tasks where it exists.
 * A MessageChannel message is the fallback: unlike setTimeout it is not
 * clamped to 4 ms after a few nested calls.
 */
export function yieldToEventLoop(): Promise<void> {
	const scheduler = (
		globalThis as {scheduler?: {yield?: () => Promise<void>}}
	).scheduler;
	if (scheduler && typeof scheduler.yield === "function")
		return scheduler.yield();
	if (typeof MessageChannel !== "undefined")
		return new Promise((resolve) => {
			const channel = new MessageChannel();
			channel.port1.onmessage = () => {
				channel.port1.close();
				resolve();
			};
			channel.port2.postMessage(undefined);
		});
	return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Yields once the current slice has run for `budget` milliseconds.
 */
export class TimeSlicer {
	// #region Properties (1)

	private _sliceStart = performance.now();

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(private readonly _budget: number = 8) {}

	// #endregion Constructors (1)

	// #region Public Methods (2)

	/** Whether the current slice is used up. */
	public get due(): boolean {
		return performance.now() - this._sliceStart >= this._budget;
	}

	/** Yield if the slice is used up, then start a new one. */
	public async yield(): Promise<void> {
		if (!this.due) return;
		await yieldToEventLoop();
		this._sliceStart = performance.now();
	}

	// #endregion Public Methods (2)
}
