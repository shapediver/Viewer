/*
 * Radiance (.hdr, RGBE) decoder, adapted from the RGBELoader of three.js
 * (https://github.com/mrdoob/three.js/blob/r184/examples/jsm/loaders/HDRLoader.js)
 * and the half-float conversion of three.js DataUtils
 * (https://github.com/mrdoob/three.js/blob/r184/src/extras/DataUtils.js).
 * three.js is MIT licensed, copyright 2010-2025 three.js authors.
 * Based on http://www.graphics.cornell.edu/~bjw/rgbe.html
 */

/** A decoded Radiance file: RGBA half floats, alpha is 1. */
export interface IDecodedRgbe {
	width: number;
	height: number;
	/** RGBA half floats, row by row as stored in the file. */
	data: Uint16Array;
	header: string;
	gamma: number;
	exposure: number;
}

/**
 * Decode a Radiance (.hdr) file to RGBA half floats.
 *
 * Runs in the HDR worker and in its main-thread fallback, so it must
 * reference nothing outside itself: its source is copied into the worker
 * with toString(). No imports, no module-level values, and no syntax that
 * needs compiler helpers at the ES6 target (no async, spread or rest).
 *
 * Returns `{error}` for a file that is not a valid Radiance file.
 */
export function decodeRgbeBuffer(
	buffer: ArrayBuffer,
): IDecodedRgbe | {error: string} {
	// float32 to float16 tables, as three.js DataUtils builds them
	const floatView = new Float32Array(1);
	const uint32View = new Uint32Array(floatView.buffer);
	const baseTable = new Uint32Array(512);
	const shiftTable = new Uint32Array(512);
	for (let i = 0; i < 256; ++i) {
		const e = i - 127;
		if (e < -27) {
			// very small number (0, -0)
			baseTable[i] = 0x0000;
			baseTable[i | 0x100] = 0x8000;
			shiftTable[i] = 24;
			shiftTable[i | 0x100] = 24;
		} else if (e < -14) {
			// small number (denorm)
			baseTable[i] = 0x0400 >> (-e - 14);
			baseTable[i | 0x100] = (0x0400 >> (-e - 14)) | 0x8000;
			shiftTable[i] = -e - 1;
			shiftTable[i | 0x100] = -e - 1;
		} else if (e <= 15) {
			// normal number
			baseTable[i] = (e + 15) << 10;
			baseTable[i | 0x100] = ((e + 15) << 10) | 0x8000;
			shiftTable[i] = 13;
			shiftTable[i | 0x100] = 13;
		} else if (e < 128) {
			// large number (Infinity, -Infinity)
			baseTable[i] = 0x7c00;
			baseTable[i | 0x100] = 0xfc00;
			shiftTable[i] = 24;
			shiftTable[i | 0x100] = 24;
		} else {
			// stay (NaN, Infinity, -Infinity)
			baseTable[i] = 0x7c00;
			baseTable[i | 0x100] = 0xfc00;
			shiftTable[i] = 13;
			shiftTable[i | 0x100] = 13;
		}
	}
	const toHalfFloat = function (value: number): number {
		// clamped to the largest half float, as DataUtils.toHalfFloat does
		floatView[0] = Math.max(-65504, Math.min(65504, value));
		const f = uint32View[0];
		const e = (f >> 23) & 0x1ff;
		return baseTable[e] + ((f & 0x007fffff) >> shiftTable[e]);
	};

	const bytes = new Uint8Array(buffer);
	let pos = 0;

	// one header line, without the newline; false at the end of the file
	const readLine = function (): string | false {
		const lineLimit = 1024;
		let line = "";
		while (pos < bytes.length && line.length < lineLimit) {
			const c = bytes[pos++];
			if (c === 0x0a) return line;
			line += String.fromCharCode(c);
		}
		return false;
	};

	// header
	const magicTokenRe = /^#\?(\S+)/;
	const gammaRe = /^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/;
	const exposureRe = /^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/;
	const formatRe = /^\s*FORMAT=(\S+)\s*$/;
	const dimensionsRe = /^\s*-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/;

	let headerString = "";
	let gamma = 1.0;
	let exposure = 1.0;
	let width = 0;
	let height = 0;
	let hasFormat = false;
	let hasDimensions = false;

	let line = readLine();
	if (line === false) return {error: "Read Error: no header found"};
	if (!magicTokenRe.test(line))
		return {error: "Bad File Format: bad initial token"};
	headerString += line + "\n";

	for (;;) {
		line = readLine();
		if (line === false) break;
		headerString += line + "\n";
		if (line.charAt(0) === "#") continue; // comment line
		let match = line.match(gammaRe);
		if (match) gamma = parseFloat(match[1]);
		match = line.match(exposureRe);
		if (match) exposure = parseFloat(match[1]);
		if (formatRe.test(line)) hasFormat = true;
		match = line.match(dimensionsRe);
		if (match) {
			hasDimensions = true;
			height = parseInt(match[1], 10);
			width = parseInt(match[2], 10);
		}
		if (hasFormat && hasDimensions) break;
	}

	if (!hasFormat) return {error: "Bad File Format: missing format specifier"};
	if (!hasDimensions)
		return {error: "Bad File Format: missing image size specifier"};

	// pixels, run-length encoded or flat
	const pixels = bytes.subarray(pos);
	let rgbe: Uint8Array;
	if (
		// run length encoding is not allowed so read flat
		width < 8 ||
		width > 0x7fff ||
		// this file is not run length encoded
		pixels[0] !== 2 ||
		pixels[1] !== 2 ||
		pixels[2] & 0x80
	) {
		rgbe = pixels;
	} else {
		if (width !== ((pixels[2] << 8) | pixels[3]))
			return {error: "Bad File Format: wrong scanline width"};

		rgbe = new Uint8Array(4 * width * height);
		const scanlineEnd = 4 * width;
		const scanline = new Uint8Array(scanlineEnd);
		let offset = 0;
		let p = 0;
		let scanlinesLeft = height;

		while (scanlinesLeft > 0 && p < pixels.length) {
			if (p + 4 > pixels.length) return {error: "Read Error"};
			if (
				pixels[p] !== 2 ||
				pixels[p + 1] !== 2 ||
				((pixels[p + 2] << 8) | pixels[p + 3]) !== width
			)
				return {error: "Bad File Format: bad rgbe scanline format"};
			p += 4;

			// the four channels of the scanline one after the other:
			// red, green, blue, then the exponent
			let ptr = 0;
			while (ptr < scanlineEnd && p < pixels.length) {
				let count = pixels[p++];
				const isEncodedRun = count > 128;
				if (isEncodedRun) count -= 128;
				if (count === 0 || ptr + count > scanlineEnd)
					return {error: "Bad File Format: bad scanline data"};
				if (isEncodedRun) {
					const value = pixels[p++];
					for (let i = 0; i < count; i++) scanline[ptr++] = value;
				} else {
					scanline.set(pixels.subarray(p, p + count), ptr);
					ptr += count;
					p += count;
				}
			}

			for (let i = 0; i < width; i++) {
				rgbe[offset] = scanline[i];
				rgbe[offset + 1] = scanline[i + width];
				rgbe[offset + 2] = scanline[i + 2 * width];
				rgbe[offset + 3] = scanline[i + 3 * width];
				offset += 4;
			}
			scanlinesLeft--;
		}
	}

	// RGBE bytes to RGBA half floats
	const numPixels = Math.floor(rgbe.length / 4);
	const data = new Uint16Array(numPixels * 4);
	const one = toHalfFloat(1);
	for (let j = 0; j < numPixels; j++) {
		const o = j * 4;
		const scale = Math.pow(2.0, rgbe[o + 3] - 128.0) / 255.0;
		data[o] = toHalfFloat(Math.min(rgbe[o] * scale, 65504));
		data[o + 1] = toHalfFloat(Math.min(rgbe[o + 1] * scale, 65504));
		data[o + 2] = toHalfFloat(Math.min(rgbe[o + 2] * scale, 65504));
		data[o + 3] = one;
	}

	return {
		width,
		height,
		data,
		header: headerString,
		gamma,
		exposure,
	};
}
