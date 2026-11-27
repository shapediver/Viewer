import {type Page} from "@playwright/test";
import * as zlib from "zlib";

/**
 * Environment map fixtures (SS-10619): generated Radiance (.hdr) files and
 * six PNG cube faces on a made-up host, and page-side counters for where an
 * .hdr file is decoded and whether a program query waits for the driver.
 */

export const ENV_ASSET_HOST = "https://envmap-perf.viewertests.invalid";

/** The .hdr files served by {@link serveEnvironmentAssets}. */
export const HDR = {
	/** 1024 x 512, flat (not run-length encoded). Cube size 256, as the built-in 1k maps. */
	a: {url: `${ENV_ASSET_HOST}/a_1024x512.hdr`, width: 1024, height: 512},
	/** 1024 x 512, run-length encoded, other colours. */
	b: {url: `${ENV_ASSET_HOST}/b_1024x512.hdr`, width: 1024, height: 512},
	/** 512 x 256, run-length encoded. Cube size 128. */
	c: {url: `${ENV_ASSET_HOST}/c_512x256.hdr`, width: 512, height: 256},
	/** Starts like a Radiance file, but has no valid header. */
	bad: {url: `${ENV_ASSET_HOST}/bad.hdr`, width: 0, height: 0},
};

/** Six 64 x 64 PNG faces of a cube map. */
export const CUBE_FACES = ["px", "nx", "py", "ny", "pz", "nz"].map(
	(face) => `${ENV_ASSET_HOST}/cube_${face}.png`,
);

/** The RGBE bytes of one pixel of a generated map. */
const rgbe = (x: number, y: number, seed: number): number[] => [
	(x * 7 + seed * 31) & 0xff,
	(y * 5 + seed * 17) & 0xff,
	((x + y) * 3 + seed * 11) & 0xff,
	// exponents around 1 and some bright pixels
	126 + ((x + y + seed) % 5),
];

/**
 * A Radiance file with a gradient. With `rle`, each scanline is run-length
 * encoded: the first half of each channel as encoded runs of the same value,
 * the second half as literal runs.
 */
export function createHdrFile(
	width: number,
	height: number,
	seed: number,
	rle: boolean,
): Buffer {
	const header = Buffer.from(
		`#?RADIANCE\n# generated test map\nFORMAT=32-bit_rle_rgbe\nEXPOSURE=1.0\n\n-Y ${height} +X ${width}\n`,
		"ascii",
	);
	const chunks: Buffer[] = [header];
	for (let y = 0; y < height; y++) {
		if (!rle) {
			const row = Buffer.alloc(width * 4);
			for (let x = 0; x < width; x++) row.set(rgbe(x, y, seed), x * 4);
			chunks.push(row);
			continue;
		}
		const bytes: number[] = [2, 2, width >> 8, width & 0xff];
		for (let channel = 0; channel < 4; channel++) {
			const values: number[] = [];
			for (let x = 0; x < width; x++) {
				// constant blocks of 16 in the first half, so encoded runs apply
				const sx = x < width / 2 ? x - (x % 16) : x;
				values.push(rgbe(sx, y, seed)[channel]);
			}
			let x = 0;
			while (x < width / 2) {
				let run = 1;
				while (
					x + run < width / 2 &&
					run < 127 &&
					values[x + run] === values[x]
				)
					run++;
				bytes.push(128 + run, values[x]);
				x += run;
			}
			while (x < width) {
				const run = Math.min(128, width - x);
				bytes.push(run, ...values.slice(x, x + run));
				x += run;
			}
		}
		chunks.push(Buffer.from(bytes));
	}
	return Buffer.concat(chunks);
}

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++)
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c >>> 0;
	}
	return table;
})();

const crc32 = (data: Buffer): number => {
	let c = 0xffffffff;
	for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
};

const pngChunk = (type: string, data: Buffer): Buffer => {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);
	const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(typeAndData));
	return Buffer.concat([length, typeAndData, crc]);
};

/** An RGB PNG with a gradient over one base colour. */
export function createPng(size: number, color: number[]): Buffer {
	const header = Buffer.alloc(13);
	header.writeUInt32BE(size, 0);
	header.writeUInt32BE(size, 4);
	header[8] = 8; // bit depth
	header[9] = 2; // RGB
	const raw = Buffer.alloc(size * (size * 3 + 1));
	for (let y = 0; y < size; y++) {
		const row = y * (size * 3 + 1);
		raw[row] = 0; // no filter
		for (let x = 0; x < size; x++)
			for (let c = 0; c < 3; c++)
				raw[row + 1 + x * 3 + c] = (color[c] + x + y) & 0xff;
	}
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		pngChunk("IHDR", header),
		pngChunk("IDAT", zlib.deflateSync(raw)),
		pngChunk("IEND", Buffer.alloc(0)),
	]);
}

const ASSETS: Record<string, {type: string; body: Buffer}> = {
	[HDR.a.url]: {
		type: "image/vnd.radiance",
		body: createHdrFile(HDR.a.width, HDR.a.height, 1, false),
	},
	[HDR.b.url]: {
		type: "image/vnd.radiance",
		body: createHdrFile(HDR.b.width, HDR.b.height, 2, true),
	},
	[HDR.c.url]: {
		type: "image/vnd.radiance",
		body: createHdrFile(HDR.c.width, HDR.c.height, 3, true),
	},
	[HDR.bad.url]: {
		type: "image/vnd.radiance",
		// the signature, but no format and no size
		body: Buffer.from("#?RADIANCE\nthis is not a radiance file\n", "ascii"),
	},
};
CUBE_FACES.forEach((url, i) => {
	ASSETS[url] = {
		type: "image/png",
		body: createPng(64, [40 * i, 200 - 30 * i, 90 + 20 * i]),
	};
});

/** Answers the downloads from {@link ENV_ASSET_HOST}, with CORS headers. */
export async function serveEnvironmentAssets(page: Pick<Page, "route">) {
	await page.route(`${ENV_ASSET_HOST}/**`, (route) => {
		const asset = ASSETS[route.request().url()];
		return asset
			? route.fulfill({
					status: 200,
					contentType: asset.type,
					headers: {"access-control-allow-origin": "*"},
					body: asset.body,
				})
			: route.fulfill({
					status: 404,
					headers: {"access-control-allow-origin": "*"},
				});
	});
}

/**
 * How the `Worker` constructor behaves for the next worker: as the browser,
 * not available, throwing as a CSP without `worker-src blob:` does, a worker
 * whose script fails at start, or a worker that cannot receive the file.
 */
export type WorkerMode =
	| "normal"
	| "missing"
	| "securityError"
	| "failsAtStart"
	| "cloneError";

/**
 * Installs `__perf.env` in the page. Run after `__perf.create()`.
 *
 * Counters (read with `env.read()`, set to 0 with `env.reset()`):
 * - `workersCreated`: `Worker` constructions.
 * - `hdrDecodesInWorker`: messages posted to a worker that carry a Radiance
 *   file (an ArrayBuffer that starts with `#?`).
 * - `hdrDecodesOnMainThread`: `Uint16Array` constructions with the length of
 *   the decoded pixels of the map being loaded (`env.expectPixels`).
 * - `programsLinked`, `pmremProgramsLinked`: `gl.linkProgram` calls, all and
 *   for the prefilter programs (shaders with `vOutputDirection`).
 * - `pmremProgramsCreated`: prefilter programs given shaders.
 * - `blockingProgramQueries`: `getProgramParameter` (not
 *   `COMPLETION_STATUS_KHR`) and `getProgramInfoLog` on a prefilter program
 *   whose parallel compile has not finished. These wait for the driver.
 */
export function installEnvironmentMapProbe() {
	const perf = (window as any).__perf;
	const SDV = (window as any).SDV;
	const gl = perf.gl as WebGL2RenderingContext;
	const renderer = perf.renderer;
	const COMPLETION_STATUS_KHR = 0x91b1;
	const parallel = Boolean(gl.getExtension("KHR_parallel_shader_compile"));

	const counters = {
		workersCreated: 0,
		hdrDecodesInWorker: 0,
		hdrDecodesOnMainThread: 0,
		programsLinked: 0,
		pmremProgramsLinked: 0,
		pmremProgramsCreated: 0,
		blockingProgramQueries: 0,
	};
	const env: any = {
		parallel,
		expectPixels: -1,
		workerMode: "normal",
		read: () => ({...counters}),
		reset: () => {
			for (const key of Object.keys(counters)) (counters as any)[key] = 0;
		},
	};
	perf.env = env;

	// workers
	const OriginalWorker = window.Worker;
	const isRadiance = (message: any) =>
		message &&
		typeof message === "object" &&
		Object.values(message).some(
			(value) =>
				value instanceof ArrayBuffer &&
				value.byteLength > 2 &&
				new Uint8Array(value, 0, 2)[0] === 0x23 &&
				new Uint8Array(value, 0, 2)[1] === 0x3f,
		);
	const WorkerProxy = function (
		this: Worker,
		url: string | URL,
		options?: WorkerOptions,
	) {
		counters.workersCreated++;
		if (env.workerMode === "securityError")
			throw new DOMException(
				"Worker blocked by the content security policy",
				"SecurityError",
			);
		const worker =
			env.workerMode === "failsAtStart"
				? new OriginalWorker(
						URL.createObjectURL(
							new Blob(["throw new Error('start failed');"], {
								type: "text/javascript",
							}),
						),
					)
				: new OriginalWorker(url, options);
		const post = worker.postMessage.bind(worker);
		worker.postMessage = ((message: any, transfer?: any) => {
			if (isRadiance(message)) {
				if (env.workerMode === "cloneError")
					throw new DOMException(
						"The file cannot be cloned",
						"DataCloneError",
					);
				counters.hdrDecodesInWorker++;
			}
			return (post as any)(message, transfer);
		}) as Worker["postMessage"];
		return worker;
	};
	Object.defineProperty(window, "Worker", {
		configurable: true,
		get: () => (env.workerMode === "missing" ? undefined : WorkerProxy),
		set: () => {},
	});

	// decodes on the main thread: the decoder allocates the half-float pixels
	const OriginalUint16Array = window.Uint16Array;
	(window as any).Uint16Array = new Proxy(OriginalUint16Array, {
		construct(target, args, newTarget) {
			if (typeof args[0] === "number" && args[0] === env.expectPixels)
				counters.hdrDecodesOnMainThread++;
			return Reflect.construct(
				target,
				args,
				newTarget === (window as any).Uint16Array ? target : newTarget,
			);
		},
	});

	// programs
	const shaderSources = new WeakMap<WebGLShader, string>();
	const pmremPrograms = new WeakSet<WebGLProgram>();
	const shaderSource = gl.shaderSource.bind(gl);
	gl.shaderSource = (shader: WebGLShader, source: string) => {
		shaderSources.set(shader, source);
		return shaderSource(shader, source);
	};
	const attachShader = gl.attachShader.bind(gl);
	gl.attachShader = (program: WebGLProgram, shader: WebGLShader) => {
		const source = shaderSources.get(shader) ?? "";
		if (
			source.includes("vOutputDirection") &&
			!pmremPrograms.has(program)
		) {
			pmremPrograms.add(program);
			counters.pmremProgramsCreated++;
		}
		return attachShader(program, shader);
	};
	const linkProgram = gl.linkProgram.bind(gl);
	gl.linkProgram = (program: WebGLProgram) => {
		counters.programsLinked++;
		if (pmremPrograms.has(program)) counters.pmremProgramsLinked++;
		return linkProgram(program);
	};
	const getProgramParameter = gl.getProgramParameter.bind(gl);
	const stillCompiling = (program: WebGLProgram) =>
		parallel &&
		pmremPrograms.has(program) &&
		!getProgramParameter(program, COMPLETION_STATUS_KHR);
	gl.getProgramParameter = (program: WebGLProgram, pname: number) => {
		if (pname !== COMPLETION_STATUS_KHR && stillCompiling(program))
			counters.blockingProgramQueries++;
		return getProgramParameter(program, pname);
	};
	const getProgramInfoLog = gl.getProgramInfoLog.bind(gl);
	gl.getProgramInfoLog = (program: WebGLProgram) => {
		if (stillCompiling(program)) counters.blockingProgramQueries++;
		return getProgramInfoLog(program);
	};

	// the scene of the last frame on the canvas, to find the prefiltered map
	let lastScene: any;
	const render = renderer.render.bind(renderer);
	renderer.render = (scene: any, camera: any) => {
		if (!renderer.getRenderTarget()) lastScene = scene;
		return render(scene, camera);
	};

	/**
	 * Set the environment map and resolve when its task ends, with the task's
	 * events. `expectPixels` is the number of half floats its decode allocates.
	 */
	env.load = (
		value: string | string[],
		expectPixels = -1,
		viewport = perf.viewport,
	) =>
		new Promise((resolve) => {
			env.expectPixels = expectPixels;
			let id: string | undefined;
			let done = false;
			const events = {starts: 0, ends: 0, cancels: 0};
			const tokens: string[] = [];
			const finish = (status: string) => {
				if (done) return;
				done = true;
				// late duplicates of the events would still be counted
				setTimeout(() => {
					tokens.forEach((token) => SDV.removeListener(token));
					resolve({status, ...events});
				}, 50);
			};
			tokens.push(
				SDV.addListener(SDV.EVENTTYPE.TASK.TASK_START, (e: any) => {
					if (
						id === undefined &&
						e.type === SDV.TASK_TYPE.ENVIRONMENT_MAP_LOADING
					)
						id = e.id;
					if (e.id === id) events.starts++;
				}),
				SDV.addListener(SDV.EVENTTYPE.TASK.TASK_END, (e: any) => {
					if (e.id !== id) return;
					events.ends++;
					finish("end");
				}),
				SDV.addListener(SDV.EVENTTYPE.TASK.TASK_CANCEL, (e: any) => {
					if (e.id !== id) return;
					events.cancels++;
					finish("cancel");
				}),
			);
			viewport.environmentMap = value;
			setTimeout(() => finish("timeout"), 60_000);
		});

	/**
	 * Size and FNV-1a hash of the prefiltered map that the materials of the
	 * last frame use. Draw a frame with a box first.
	 */
	env.mapHash = () => {
		let target: any;
		lastScene?.traverse((object: any) => {
			const materials = Array.isArray(object.material)
				? object.material
				: [object.material];
			for (const material of materials)
				if (material?.envMap?.renderTarget)
					target = material.envMap.renderTarget;
		});
		if (!target) return null;
		const pixels = new OriginalUint16Array(
			target.width * target.height * 4,
		);
		renderer.readRenderTargetPixels(
			target,
			0,
			0,
			target.width,
			target.height,
			pixels,
		);
		let hash = 0x811c9dc5;
		let nonZero = 0;
		for (let i = 0; i < pixels.length; i++) {
			if (pixels[i] !== 0) nonZero++;
			hash ^= pixels[i];
			hash = Math.imul(hash, 0x01000193) >>> 0;
		}
		return {
			width: target.width,
			height: target.height,
			hash,
			nonZero,
		};
	};
}
