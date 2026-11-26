import {DataUtils} from "three";
import {decodeRgbeBuffer} from "../src/three/loaders/decodeRgbeBuffer";
import {getRgbeDecoder} from "../src/three/loaders/RGBEWorkerDecoder";

/** The RGBE bytes of one pixel of a generated map. */
const rgbe = (x: number, y: number, bright: boolean): number[] => [
	(x * 7 + y) & 0xff,
	(y * 5 + 3) & 0xff,
	((x + y) * 3) & 0xff,
	// 128 + 40 gives values far above the largest half float (65504)
	bright && (x + y) % 3 === 0 ? 168 : 126 + ((x + y) % 5),
];

/** The pixels of a generated map, as RGBE bytes. */
const image = (width: number, height: number, bright = false): number[][] => {
	const pixels: number[][] = [];
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) pixels.push(rgbe(x, y, bright));
	return pixels;
};

/** A Radiance file, flat or run-length encoded (encoded and literal runs). */
const hdrFile = (
	width: number,
	height: number,
	pixels: number[][],
	rle: boolean,
): ArrayBuffer => {
	const bytes: number[] = Array.from(
		Buffer.from(
			`#?RADIANCE\n# a comment\nGAMMA=1.0\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`,
			"ascii",
		),
	);
	for (let y = 0; y < height; y++) {
		const row = pixels.slice(y * width, (y + 1) * width);
		if (!rle) {
			row.forEach((p) => bytes.push(...p));
			continue;
		}
		bytes.push(2, 2, width >> 8, width & 0xff);
		for (let channel = 0; channel < 4; channel++) {
			const values = row.map((p) => p[channel]);
			// the first 16 values as one encoded run of the first value...
			bytes.push(128 + 16, values[0]);
			for (let i = 0; i < 16; i++) values[i] = values[0];
			let x = 16;
			// ...the rest as literal runs
			while (x < width) {
				const run = Math.min(128, width - x);
				bytes.push(run, ...values.slice(x, x + run));
				x += run;
			}
			row.forEach((p, i) => (p[channel] = values[i]));
		}
	}
	return new Uint8Array(bytes).buffer;
};

/** What three.js's RGBELoader returns for these pixels: RGBA half floats. */
const reference = (pixels: number[][]): Uint16Array => {
	const data = new Uint16Array(pixels.length * 4);
	pixels.forEach((p, i) => {
		const scale = Math.pow(2.0, p[3] - 128.0) / 255.0;
		for (let c = 0; c < 3; c++)
			data[i * 4 + c] = DataUtils.toHalfFloat(
				Math.min(p[c] * scale, 65504),
			);
		data[i * 4 + 3] = DataUtils.toHalfFloat(1);
	});
	return data;
};

describe("decodeRgbeBuffer", () => {
	const width = 40;
	const height = 6;

	test.each([
		["flat", false, false],
		["run-length encoded", true, false],
		["flat, values above 65504", false, true],
		["run-length encoded, values above 65504", true, true],
	])("%s: bit for bit as three.js", (_name, rle, bright) => {
		const pixels = image(width, height, bright);
		const file = hdrFile(width, height, pixels, rle);
		const decoded = decodeRgbeBuffer(file);
		if ("error" in decoded) throw new Error(decoded.error);
		expect(decoded.width).toBe(width);
		expect(decoded.height).toBe(height);
		expect(decoded.gamma).toBe(1);
		expect(decoded.exposure).toBe(1);
		expect(decoded.header).toContain("FORMAT=32-bit_rle_rgbe");
		expect(Array.from(decoded.data)).toEqual(Array.from(reference(pixels)));
	});

	test("clamps values above 65504 to the largest half float", () => {
		const decoded = decodeRgbeBuffer(
			hdrFile(width, height, image(width, height, true), false),
		);
		if ("error" in decoded) throw new Error(decoded.error);
		// 0x7bff is 65504, 0x7c00 would be infinity
		expect(Math.max(...Array.from(decoded.data))).toBe(0x7bff);
	});

	test.each([
		["no magic token", "RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 1 +X 1\n"],
		["no format", "#?RADIANCE\n\n-Y 1 +X 1\n"],
		["no size", "#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n"],
		["empty", ""],
	])("returns an error for a bad file: %s", (_name, text) => {
		const result = decodeRgbeBuffer(
			new Uint8Array(Buffer.from(text, "ascii")).buffer,
		);
		expect("error" in result).toBe(true);
	});

	test("is self-contained, so that it runs in a worker from its source", () => {
		const isolated = new Function(
			`"use strict"; return (${decodeRgbeBuffer.toString()});`,
		)() as typeof decodeRgbeBuffer;
		const pixels = image(width, height);
		const decoded = isolated(hdrFile(width, height, pixels, true));
		if ("error" in decoded) throw new Error(decoded.error);
		expect(Array.from(decoded.data)).toEqual(Array.from(reference(pixels)));
	});
});

describe("RGBEWorkerDecoder", () => {
	test("decodes on the main thread where there is no worker", async () => {
		expect(typeof (globalThis as {Worker?: unknown}).Worker).toBe(
			"undefined",
		);
		const pixels = image(16, 2);
		const file = hdrFile(16, 2, pixels, true);
		const decoded = await getRgbeDecoder().decode(file);
		expect(Array.from(decoded.data)).toEqual(Array.from(reference(pixels)));
		// the caller's buffer is not transferred or changed
		expect(file.byteLength).toBeGreaterThan(0);
	});

	test("rejects a bad file", async () => {
		await expect(
			getRgbeDecoder().decode(new Uint8Array([1, 2, 3]).buffer),
		).rejects.toThrow("no header found");
	});
});
