import {CAMERA_TYPE} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import {PerspectiveCameraControls} from "../src/implementation/controls/PerspectiveCameraControls";
import {type ICamera} from "../src/interfaces/camera/ICamera";

const CANVAS_HEIGHT = 600;
const FRAME_RATES = [30, 60, 120, 144];
/** time constant of the inertia for damping = 0.1 */
const TAU_RELEASE = -(1000 / 60) / Math.log(0.9);

/**
 * Controls of a perspective camera that looks from the front onto the origin,
 * with a clock for the pointer events and the frames.
 */
class Rig {
	public readonly controls: PerspectiveCameraControls;
	public position = vec3.create();
	public target = vec3.create();
	public time = 1000;

	constructor() {
		const camera = {
			id: "camera",
			type: CAMERA_TYPE.PERSPECTIVE,
			active: true,
			fov: 45,
			position: vec3.fromValues(0, -10, 0),
			target: vec3.fromValues(0, 0, 0),
			defaultPosition: vec3.fromValues(0, -10, 0),
			defaultTarget: vec3.fromValues(0, 0, 0),
			revertAtMouseUp: false,
		};
		this.controls = new PerspectiveCameraControls(
			camera as unknown as ICamera,
			true,
		);
		this.controls.canvas = {
			clientWidth: 800,
			clientHeight: CANVAS_HEIGHT,
		} as HTMLCanvasElement;
		this.controls.position = vec3.clone(camera.position);
		this.controls.target = vec3.clone(camera.target);
		// the first frame, as after the page was loaded
		this.frame(0);
	}

	/** azimuth of the camera around the target */
	public get azimuth(): number {
		const offset = vec3.subtract(vec3.create(), this.position, this.target);
		return Math.atan2(offset[0], -offset[1]);
	}

	public get distance(): number {
		return vec3.distance(this.position, this.target);
	}

	/** polar angle of the camera, 0 looks down from the top */
	public get polar(): number {
		const offset = vec3.subtract(vec3.create(), this.position, this.target);
		return Math.acos(offset[2] / vec3.length(offset));
	}

	public down(x: number, y: number, button = 0): void {
		this.controls.cameraControlsEventDistribution.onPointerDown(
			this.pointerEvent(x, y, button),
		);
	}

	/** render one frame of the given length */
	public frame(deltaTime: number): void {
		this.time += deltaTime;
		const {position, target} = this.controls.update(deltaTime);
		this.position = position;
		this.target = target;
	}

	/** render frames of the given length for the given time */
	public frames(duration: number, deltaTime: number): void {
		const end = this.time + duration;
		while (this.time < end - 1e-9)
			this.frame(Math.min(deltaTime, end - this.time));
	}

	public move(x: number, y: number, button = 0): void {
		this.controls.cameraControlsEventDistribution.onPointerMove(
			this.pointerEvent(x, y, button),
		);
	}

	/** render frames until the camera stands still */
	public settle(deltaTime = 1000 / 60): void {
		let frames = 0;
		do this.frame(deltaTime);
		while (this.controls.isMoving() && frames++ < 10000);
		expect(this.controls.isMoving()).toBe(false);
	}

	public up(x: number, y: number, button = 0): void {
		this.controls.cameraControlsEventDistribution.onPointerEnd(
			this.pointerEvent(x, y, button),
		);
	}

	public wheel(deltaY: number): void {
		this.controls.cameraControlsEventDistribution.onMouseWheel({
			deltaY,
		} as WheelEvent);
	}

	private pointerEvent(x: number, y: number, button: number): PointerEvent {
		return {
			isPrimary: true,
			pointerType: "mouse",
			button,
			clientX: x,
			clientY: y,
			pageX: x,
			pageY: y,
			timeStamp: this.time,
		} as PointerEvent;
	}
}

/** the rotation of a drag of the given pixels at rotationSpeed 0.5 */
const rotationOf = (pixels: number, rotationSpeed = 0.5) =>
	(pixels * 2 * Math.PI * (rotationSpeed / 0.5)) / CANVAS_HEIGHT;

describe("drag", () => {
	test.each([
		["one event per frame", 1],
		["two events per frame", 2],
		["one event every second frame", 0.5],
	])("rotates by the pointer distance with %s", (_name, eventsPerFrame) => {
		const rig = new Rig();
		const distance = 150;
		const events = 30;
		rig.down(100, 300);
		for (let i = 1; i <= events; i++) {
			rig.move(100 + (distance * i) / events, 300);
			if (eventsPerFrame >= 1) {
				if (i % eventsPerFrame === 0) rig.frame(1000 / 60);
			} else {
				rig.frames(1000 / 60 / eventsPerFrame, 1000 / 60);
			}
		}
		// rest before the release, so there is no inertia
		rig.frames(100, 1000 / 60);
		rig.up(100 + distance, 300);
		rig.settle();

		expect(rig.azimuth).toBeCloseTo(-rotationOf(distance), 4);
		expect(rig.polar).toBeCloseTo(Math.PI / 2, 4);
		expect(rig.distance).toBeCloseTo(10, 4);
	});

	test("rotates by one full turn per canvas height at rotationSpeed 0.5", () => {
		const rig = new Rig();
		rig.down(100, 300);
		// a quarter of the canvas height
		rig.move(100 + CANVAS_HEIGHT / 4, 300);
		rig.frames(1000, 1000 / 60);
		expect(rig.azimuth).toBeCloseTo(-Math.PI / 2, 4);
	});

	test("scales with rotationSpeed", () => {
		const rig = new Rig();
		rig.controls.rotationSpeed = 0.25;
		rig.down(100, 300);
		rig.move(220, 300);
		rig.frames(1000, 1000 / 60);
		expect(rig.azimuth).toBeCloseTo(-rotationOf(120, 0.25), 4);
	});

	test("pans the point under the pointer with the pointer at panSpeed 0.5", () => {
		const rig = new Rig();
		rig.down(400, 300, 2);
		rig.move(460, 300, 2);
		rig.frames(1000, 1000 / 60);

		// height of the view at the target in world units
		const viewHeight = 2 * 10 * Math.tan((45 / 2) * (Math.PI / 180));
		const expected = (60 / CANVAS_HEIGHT) * viewHeight;
		// the camera moves against the pointer, the scene with it
		expect(rig.target[0]).toBeCloseTo(-expected, 4);
		expect(rig.position[0]).toBeCloseTo(-expected, 4);
		expect(rig.distance).toBeCloseTo(10, 4);
	});

	test("stops when the pointer stops while the button is down", () => {
		const rig = new Rig();
		const tau = rig.controls.movementSmoothness * 100;
		rig.down(100, 300);
		for (let i = 1; i <= 20; i++) {
			rig.move(100 + 10 * i, 300);
			rig.frame(1000 / 60);
		}
		const goal = -rotationOf(200);
		const lag = Math.abs(goal - rig.azimuth);
		expect(lag).toBeGreaterThan(0);

		// after five time constants nearly nothing of the lag is left
		rig.frames(5 * tau, 1000 / 60);
		expect(Math.abs(goal - rig.azimuth)).toBeLessThan(0.06 * lag);

		// then the camera stands still on its goal
		rig.frames(10 * tau, 1000 / 60);
		const position = vec3.clone(rig.position);
		rig.frames(200, 1000 / 60);
		expect(vec3.exactEquals(position, rig.position)).toBe(true);
		expect(rig.azimuth).toBeCloseTo(goal, 4);
	});

	test("follows the pointer exactly with movementSmoothness 0", () => {
		const rig = new Rig();
		rig.controls.movementSmoothness = 0;
		rig.down(100, 300);
		for (let i = 1; i <= 10; i++) {
			rig.move(100 + 12 * i, 300);
			rig.frame(1000 / 60);
			expect(rig.azimuth).toBeCloseTo(-rotationOf(12 * i), 4);
		}
	});

	test("a second finger ends the rotation of the first one", () => {
		// the pinch distance is measured relative to the window
		const globals = globalThis as {window?: unknown};
		const originalWindow = globals.window;
		globals.window = {innerWidth: 800, innerHeight: CANVAS_HEIGHT};

		const rig = new Rig();
		const events = rig.controls.cameraControlsEventDistribution;
		const touch = (x: number, y: number, isPrimary: boolean) =>
			({
				isPrimary,
				pointerType: "touch",
				button: 0,
				clientX: x,
				clientY: y,
				pageX: x,
				pageY: y,
				timeStamp: rig.time,
			}) as PointerEvent;

		// one finger rotates
		events.onPointerDown(touch(100, 300, true));
		for (let i = 1; i <= 5; i++) {
			rig.frame(8);
			events.onPointerMove(touch(100 + 10 * i, 300, true));
		}
		rig.frame(8);
		expect(Math.abs(rig.azimuth)).toBeGreaterThan(0);

		// the second finger starts the pinch: the rotation that was still to
		// be done is dropped, and a quick release gives no rotation inertia
		events.onPointerDown(touch(300, 300, false));
		rig.frame(8);
		const azimuth = rig.azimuth;
		rig.frame(8);
		events.onPointerEnd(touch(300, 300, false));
		rig.frames(500, 1000 / 60);
		globals.window = originalWindow;
		expect(rig.azimuth).toBe(azimuth);
	});

	test("does not count a click as camera movement", () => {
		const rig = new Rig();
		rig.down(100, 300);
		rig.frame(1000 / 60);
		expect(rig.controls.isMoving()).toBe(false);
		rig.up(100, 300);
		rig.frame(1000 / 60);
		expect(rig.controls.isMoving()).toBe(false);
		expect(rig.azimuth).toBeCloseTo(0, 6);
	});
});

describe("release", () => {
	/** drag with 0.5 px per ms and release at the given time after the last move */
	function flick(rig: Rig, rest: number): number {
		rig.controls.movementSmoothness = 0;
		let x = 100;
		rig.down(x, 300);
		for (let i = 0; i < 20; i++) {
			rig.frame(8);
			x += 4;
			rig.move(x, 300);
		}
		if (rest > 0) rig.frames(rest, 8);
		rig.up(x, 300);
		rig.settle();
		return x - 100;
	}

	test("coasts by the pointer speed times the time constant of the damping", () => {
		const rig = new Rig();
		const dragged = flick(rig, 0);
		const coast = rotationOf(0.5 * TAU_RELEASE);
		expect(Math.abs(rig.azimuth)).toBeGreaterThan(rotationOf(dragged));
		expect(
			Math.abs(Math.abs(rig.azimuth) - rotationOf(dragged) - coast),
		).toBeLessThan(0.02 * coast);
	});

	test("does not coast when the pointer stood still for 60 ms", () => {
		const rig = new Rig();
		const dragged = flick(rig, 60);
		expect(rig.azimuth).toBeCloseTo(-rotationOf(dragged), 4);
	});

	test("does not coast with damping 1", () => {
		const rig = new Rig();
		rig.controls.damping = 1;
		const dragged = flick(rig, 0);
		expect(rig.azimuth).toBeCloseTo(-rotationOf(dragged), 4);
	});

	test("a press catches the coasting camera", () => {
		const rig = new Rig();
		rig.controls.movementSmoothness = 0;
		let x = 100;
		rig.down(x, 300);
		for (let i = 0; i < 20; i++) {
			rig.frame(8);
			x += 4;
			rig.move(x, 300);
		}
		rig.up(x, 300);
		rig.frames(50, 1000 / 60);
		expect(rig.controls.isMoving()).toBe(true);

		rig.down(x, 300);
		rig.frame(1000 / 60);
		const azimuth = rig.azimuth;
		rig.frames(300, 1000 / 60);
		expect(rig.azimuth).toBe(azimuth);
		expect(rig.controls.isMoving()).toBe(false);
	});

	test.each(FRAME_RATES)("coasts the same way at %i Hz", (rate) => {
		const reference = new Rig();
		const rig = new Rig();
		for (const r of [reference, rig]) {
			r.controls.movementSmoothness = 0;
			r.down(100, 300);
			for (let i = 1; i <= 10; i++) {
				// the events of both rigs have the same time stamps
				r.time += 8;
				r.move(100 + 4 * i, 300);
			}
			r.up(140, 300);
		}
		const start = reference.azimuth;
		// compare during the inertia and at its end
		reference.frames(150, 1);
		rig.frames(150, 1000 / rate);
		const moved = Math.abs(reference.azimuth - start);
		expect(moved).toBeGreaterThan(0);
		expect(Math.abs(rig.azimuth - reference.azimuth)).toBeLessThan(
			0.02 * moved,
		);
		reference.settle(1);
		rig.settle(1000 / rate);
		expect(rig.azimuth).toBeCloseTo(reference.azimuth, 4);
	});
});

describe("wheel", () => {
	test.each(FRAME_RATES)("zooms the same distance at %i Hz", (rate) => {
		const reference = new Rig();
		reference.wheel(-100);
		reference.frames(200, 1);

		const rig = new Rig();
		rig.wheel(-100);
		rig.frames(200, 1000 / rate);
		// on the way
		const moved = 10 - reference.distance;
		expect(moved).toBeGreaterThan(0.1);
		expect(Math.abs(rig.distance - reference.distance)).toBeLessThan(
			0.02 * moved,
		);

		// at the end: one notch is about 12 % of the distance
		rig.settle(1000 / rate);
		expect(rig.distance).toBeCloseTo(10 * Math.exp(-0.125), 3);
		expect(1 - rig.distance / 10).toBeGreaterThan(0.11);
		expect(1 - rig.distance / 10).toBeLessThan(0.13);
	});

	test("zooms out and in by the same factor", () => {
		const rig = new Rig();
		rig.wheel(100);
		rig.settle();
		expect(rig.distance).toBeCloseTo(10 * Math.exp(0.125), 3);
		rig.wheel(-100);
		rig.settle();
		expect(rig.distance).toBeCloseTo(10, 3);
	});

	test("adds up the notches of one frame", () => {
		const rig = new Rig();
		rig.wheel(-100);
		rig.wheel(-100);
		rig.wheel(-100);
		rig.settle();
		expect(rig.distance).toBeCloseTo(10 * Math.exp(-0.375), 3);
	});
});

describe("auto rotation", () => {
	/** the rotation of the camera over the given time */
	function rotation(rig: Rig, duration: number, next: () => number) {
		let angle = 0;
		let last = rig.azimuth;
		const end = rig.time + duration;
		while (rig.time < end - 1e-9) {
			rig.frame(Math.min(next(), end - rig.time));
			let delta = rig.azimuth - last;
			if (delta > Math.PI) delta -= 2 * Math.PI;
			if (delta < -Math.PI) delta += 2 * Math.PI;
			angle += delta;
			last = rig.azimuth;
		}
		return angle;
	}

	test.each(FRAME_RATES)(
		"turns once per minute at autoRotationSpeed 1 and %i Hz",
		(rate) => {
			const rig = new Rig();
			rig.controls.enableAutoRotation = true;
			rig.controls.autoRotationSpeed = 1;
			const angle = rotation(rig, 60000, () => 1000 / rate);
			expect(Math.abs(angle)).toBeGreaterThan(2 * Math.PI * 0.995);
			expect(Math.abs(angle)).toBeLessThan(2 * Math.PI * 1.005);
		},
	);

	test("turns once per minute with irregular frames", () => {
		const rig = new Rig();
		rig.controls.enableAutoRotation = true;
		rig.controls.autoRotationSpeed = 1;
		const lengths = [4, 16.7, 33, 8.3, 50, 6.9, 90, 12];
		let i = 0;
		const angle = rotation(rig, 60000, () => lengths[i++ % lengths.length]);
		expect(Math.abs(angle)).toBeGreaterThan(2 * Math.PI * 0.995);
		expect(Math.abs(angle)).toBeLessThan(2 * Math.PI * 1.005);
	});

	test("counts a frame of 5 s as 100 ms", () => {
		const rig = new Rig();
		rig.controls.enableAutoRotation = true;
		rig.controls.autoRotationSpeed = 1;
		rig.frame(5000);
		expect(Math.abs(rig.azimuth)).toBeCloseTo(
			(2 * Math.PI * 100) / 60000,
			5,
		);
	});

	test("does not move in the first frame", () => {
		const rig = new Rig();
		rig.controls.enableAutoRotation = true;
		rig.controls.autoRotationSpeed = 1;
		rig.frame(0);
		expect(rig.azimuth).toBeCloseTo(0, 6);
	});
});

describe("restrictions", () => {
	test("stops at the polar limit without overshoot", () => {
		const rig = new Rig();
		rig.controls.rotationRestriction = {
			minPolarAngle: 0,
			maxPolarAngle: 100,
			minAzimuthAngle: -Infinity,
			maxAzimuthAngle: Infinity,
		};
		const limit = (100 * Math.PI) / 180;
		// dragging up turns the camera below the scene, far past the limit
		rig.down(100, 500);
		let y = 500;
		for (let i = 0; i < 10; i++) {
			y -= 30;
			rig.move(100, y);
			rig.frame(1000 / 60);
			expect(rig.polar).toBeLessThanOrEqual(limit + 1e-4);
		}
		rig.up(100, y);
		let last = rig.polar;
		for (let i = 0; i < 120; i++) {
			rig.frame(1000 / 60);
			expect(rig.polar).toBeLessThanOrEqual(limit + 1e-4);
			// no way back from the limit
			expect(rig.polar).toBeGreaterThanOrEqual(last - 1e-4);
			last = rig.polar;
		}
		expect(rig.polar).toBeCloseTo(limit, 3);
		expect(rig.controls.isMoving()).toBe(false);
	});

	test("puts a camera outside of the limits onto the limit and leaves it there", async () => {
		const rig = new Rig();
		rig.controls.rotationRestriction = {
			minPolarAngle: 30,
			maxPolarAngle: 180,
			minAzimuthAngle: -Infinity,
			maxAzimuthAngle: Infinity,
		};
		rig.controls.zoomRestriction = {minDistance: 8, maxDistance: Infinity};
		// 10 degrees from the top and too close
		const polar = (10 * Math.PI) / 180;
		await rig.controls.animate(
			[
				{
					position: vec3.fromValues(
						0,
						-4 * Math.sin(polar),
						4 * Math.cos(polar),
					),
					target: vec3.create(),
				},
			],
			{duration: 0},
		);
		rig.frames(1000, 1000 / 60);
		expect(rig.polar).toBeCloseTo((30 * Math.PI) / 180, 4);
		expect(rig.distance).toBeCloseTo(8, 4);
		expect(rig.controls.isMoving()).toBe(false);
	});

	test("stops at the minimum distance without overshoot", () => {
		const rig = new Rig();
		rig.controls.zoomRestriction = {minDistance: 8, maxDistance: Infinity};
		for (let i = 0; i < 6; i++) rig.wheel(-100);
		let last = rig.distance;
		for (let i = 0; i < 240; i++) {
			rig.frame(1000 / 60);
			expect(rig.distance).toBeGreaterThanOrEqual(8 - 1e-4);
			expect(rig.distance).toBeLessThanOrEqual(last + 1e-4);
			last = rig.distance;
		}
		expect(rig.distance).toBeCloseTo(8, 3);
		expect(rig.controls.isMoving()).toBe(false);

		// the way back starts at once
		rig.wheel(100);
		rig.frames(100, 1000 / 60);
		expect(rig.distance).toBeGreaterThan(8.01);
	});
});

describe("camera animations", () => {
	test("setting the camera drops the motion of the input", async () => {
		const rig = new Rig();
		rig.wheel(-100);
		rig.frames(50, 1000 / 60);
		expect(rig.controls.isMoving()).toBe(true);

		await rig.controls.animate(
			[
				{
					position: vec3.fromValues(0, -20, 0),
					target: vec3.fromValues(0, 0, 0),
				},
			],
			{duration: 0},
		);
		rig.frames(500, 1000 / 60);
		expect(rig.distance).toBeCloseTo(20, 4);
		expect(rig.controls.isMoving()).toBe(false);
	});

	test("input from before an animation does not interrupt it", () => {
		const rig = new Rig();
		const interpolation = (
			rig.controls as unknown as {
				_cameraInterpolationManager: {active(): boolean; stop(): void};
			}
		)._cameraInterpolationManager;

		// the last move of a drag and the animation of revertAtMouseUp
		// arrive in the same frame
		rig.down(100, 300);
		rig.move(140, 300);
		void rig.controls.animate(
			[
				{position: vec3.clone(rig.position), target: vec3.create()},
				{position: vec3.fromValues(0, -20, 0), target: vec3.create()},
			],
			{duration: 500},
		);
		rig.frame(1000 / 60);
		expect(interpolation.active()).toBe(true);

		// input during the animation interrupts it
		rig.move(180, 300);
		rig.frame(1000 / 60);
		expect(interpolation.active()).toBe(false);
	});

	test("reset drops the motion of the input", () => {
		const rig = new Rig();
		rig.wheel(-100);
		rig.frames(50, 1000 / 60);
		const distance = rig.distance;
		rig.controls.reset();
		rig.frames(500, 1000 / 60);
		expect(rig.distance).toBeCloseTo(distance, 5);
	});
});
