/**
 * Measures how fast a gesture moves, from the steps of its last few events.
 */
export class VelocityTracker {
	// #region Properties (2)

	private _samples: {time: number; delta: number[]}[] = [];

	/**
	 * The time span in milliseconds that is averaged. A gesture whose last
	 * step is older than this has no velocity.
	 */
	public static readonly WINDOW = 50;

	// #endregion Properties (2)

	// #region Constructors (1)

	constructor(private readonly _dimensions: number) {}

	// #endregion Constructors (1)

	// #region Public Methods (4)

	/**
	 * Add the step of one event.
	 */
	public add(time: number, delta: number[]): void {
		this._samples.push({time, delta});
		// keep one sample older than the window as the start of the average
		while (
			this._samples.length > 2 &&
			this._samples[1].time < time - VelocityTracker.WINDOW
		)
			this._samples.shift();
	}

	public reset(): void {
		this._samples = [];
	}

	/**
	 * Start a gesture at the given time.
	 */
	public start(time: number): void {
		this._samples = [
			{time, delta: new Array<number>(this._dimensions).fill(0)},
		];
	}

	/**
	 * The velocity at the given time in units per millisecond.
	 */
	public velocity(time: number): number[] {
		const velocity = new Array<number>(this._dimensions).fill(0);
		if (this._samples.length < 2) return velocity;

		const last = this._samples[this._samples.length - 1];
		if (time - last.time > VelocityTracker.WINDOW) return velocity;

		// the first sample is the start of the measured span, its own step
		// happened before it
		let first = 0;
		while (
			first < this._samples.length - 2 &&
			this._samples[first + 1].time < last.time - VelocityTracker.WINDOW
		)
			first++;

		const duration = Math.max(time, last.time) - this._samples[first].time;
		if (!(duration > 0)) return velocity;

		for (let i = first + 1; i < this._samples.length; i++)
			for (let d = 0; d < this._dimensions; d++)
				velocity[d] += this._samples[i].delta[d];
		for (let d = 0; d < this._dimensions; d++) velocity[d] /= duration;

		return velocity;
	}

	// #endregion Public Methods (4)
}
