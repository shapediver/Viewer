/**
 * Follows a goal with a critically damped spring.
 *
 * The damper only stores how far the value still is from its goal
 * ({@link remaining}) and how fast the value moves ({@link velocity}).
 * Input adds to the remaining distance, {@link step} returns the part of it
 * that the value moves in one frame. The step is the closed-form solution of
 * the spring, so the result at a given time does not depend on the frame rate
 * and any frame length is stable.
 */
export class Damper {
	// #region Properties (2)

	private _remaining = 0;
	private _velocity = 0;

	// #endregion Properties (2)

	// #region Public Getters And Setters (4)

	/**
	 * Distance from the value to its goal (goal - value).
	 */
	public get remaining(): number {
		return this._remaining;
	}

	public set remaining(value: number) {
		this._remaining = value;
	}

	/**
	 * Speed of the value in units per millisecond.
	 */
	public get velocity(): number {
		return this._velocity;
	}

	public set velocity(value: number) {
		this._velocity = value;
	}

	// #endregion Public Getters And Setters (4)

	// #region Public Methods (4)

	/**
	 * Move the goal by the given amount.
	 */
	public add(delta: number): void {
		this._remaining += delta;
	}

	/**
	 * If the value has reached its goal and stands still.
	 */
	public isSettled(): boolean {
		return this._remaining === 0 && this._velocity === 0;
	}

	/**
	 * Forget the goal and stop.
	 */
	public reset(): void {
		this._remaining = 0;
		this._velocity = 0;
	}

	/**
	 * Advance the spring and return how far the value moves in this step.
	 *
	 * @param deltaTime The length of the step in milliseconds.
	 * @param tau The time constant of the spring in milliseconds. 0 moves the value onto the goal at once.
	 * @param epsilon Below this remaining distance (and the speed to cover it within tau) the value is put onto the goal.
	 */
	public step(deltaTime: number, tau: number, epsilon: number = 0): number {
		if (!(tau > 0)) {
			const increment = this._remaining;
			this._remaining = 0;
			this._velocity = 0;
			return increment;
		}

		if (!(deltaTime > 0)) return 0;

		const omega = 1 / tau;
		// offset of the value from its goal
		const offset = -this._remaining;
		const v = this._velocity + omega * offset;
		const x = offset + deltaTime * v;
		const e = Math.exp(-omega * deltaTime);

		let remaining = -x * e;
		this._velocity = (v - omega * x) * e;

		if (
			Math.abs(remaining) <= epsilon &&
			Math.abs(this._velocity) * tau <= epsilon
		) {
			remaining = 0;
			this._velocity = 0;
		}

		const increment = this._remaining - remaining;
		this._remaining = remaining;
		return increment;
	}

	// #endregion Public Methods (4)
}
