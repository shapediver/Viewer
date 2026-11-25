import {Damper} from "../src/implementation/controls/Damper";
import {VelocityTracker} from "../src/implementation/controls/VelocityTracker";

/**
 * Advance the damper to the given time in steps of the given length and
 * return how far the value has moved.
 */
function run(damper: Damper, until: number, step: number, tau: number) {
	let value = 0;
	let time = 0;
	while (time < until - 1e-9) {
		const deltaTime = Math.min(step, until - time);
		value += damper.step(deltaTime, tau);
		time += deltaTime;
	}
	return value;
}

describe("Damper", () => {
	test("gives the same value at the same time for any frame length", () => {
		const values = [33.3, 16.7, 8.3, 6.9].map((step) => {
			const damper = new Damper();
			damper.add(1);
			return run(damper, 200, step, 50);
		});
		for (const value of values) {
			expect(Math.abs(value - values[0])).toBeLessThan(1e-6);
			expect(value).toBeGreaterThan(0.5);
			expect(value).toBeLessThan(1);
		}
	});

	test("keeps its speed when the frame length changes", () => {
		const even = new Damper();
		even.add(1);
		const evenValue = run(even, 120, 10, 50);

		const uneven = new Damper();
		uneven.add(1);
		let unevenValue = 0;
		for (const step of [3, 40, 7, 50, 20])
			unevenValue += uneven.step(step, 50);

		expect(Math.abs(unevenValue - evenValue)).toBeLessThan(1e-6);
		expect(Math.abs(uneven.velocity - even.velocity)).toBeLessThan(1e-9);
	});

	test("is stable for one long step", () => {
		const damper = new Damper();
		damper.add(1);
		const increment = damper.step(100, 50);
		expect(increment).toBeGreaterThan(0);
		expect(increment).toBeLessThan(1);
		expect(damper.remaining).toBeCloseTo(1 - increment, 12);

		const long = new Damper();
		long.add(1);
		expect(long.step(100000, 50)).toBeCloseTo(1, 9);
	});

	test("snaps with a time constant of 0", () => {
		const damper = new Damper();
		damper.add(2.5);
		damper.velocity = 3;
		expect(damper.step(16, 0)).toBe(2.5);
		expect(damper.isSettled()).toBe(true);
		// also in a frame without duration
		damper.add(-1);
		expect(damper.step(0, 0)).toBe(-1);
	});

	test("does not move in a frame without duration", () => {
		const damper = new Damper();
		damper.add(1);
		expect(damper.step(0, 50)).toBe(0);
		expect(damper.remaining).toBe(1);
	});

	test("reaches the goal exactly once it is within epsilon", () => {
		const damper = new Damper();
		damper.add(1);
		let value = 0;
		let frames = 0;
		while (!damper.isSettled() && frames++ < 1000)
			value += damper.step(16, 50, 1e-5);
		expect(damper.isSettled()).toBe(true);
		expect(value).toBeCloseTo(1, 12);
		expect(frames).toBeLessThan(100);
	});

	test("coasts as an exponential when the goal is one time constant ahead", () => {
		// a value that moves with speed v and whose goal is v * tau ahead
		// loses the same fraction of its remaining way in every interval
		const tau = 158;
		const damper = new Damper();
		damper.velocity = 0.01;
		damper.add(0.01 * tau);
		const total = damper.remaining;
		damper.step(tau, tau);
		expect(damper.remaining / total).toBeCloseTo(Math.exp(-1), 9);
		damper.step(tau, tau);
		expect(damper.remaining / total).toBeCloseTo(Math.exp(-2), 9);
	});
});

describe("VelocityTracker", () => {
	test("averages the steps of the last 50 ms", () => {
		const tracker = new VelocityTracker(2);
		tracker.start(0);
		// slow start, then 2 units per 10 ms
		tracker.add(100, [1, 0]);
		for (let time = 110; time <= 200; time += 10)
			tracker.add(time, [2, -1]);
		const velocity = tracker.velocity(200);
		expect(velocity[0]).toBeCloseTo(0.2, 9);
		expect(velocity[1]).toBeCloseTo(-0.1, 9);
	});

	test("is zero when the last step is older than 50 ms", () => {
		const tracker = new VelocityTracker(1);
		tracker.start(0);
		tracker.add(10, [5]);
		tracker.add(20, [5]);
		expect(tracker.velocity(20)[0]).toBeGreaterThan(0);
		expect(tracker.velocity(80)[0]).toBe(0);
	});

	test("is zero without a step", () => {
		const tracker = new VelocityTracker(1);
		expect(tracker.velocity(0)[0]).toBe(0);
		tracker.start(0);
		expect(tracker.velocity(10)[0]).toBe(0);
	});

	test("gets slower while the pointer rests before the release", () => {
		const tracker = new VelocityTracker(1);
		tracker.start(0);
		tracker.add(10, [1]);
		tracker.add(20, [1]);
		expect(tracker.velocity(40)[0]).toBeLessThan(tracker.velocity(20)[0]);
	});
});
