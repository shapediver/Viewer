/* eslint-disable no-undef */
/**
 * Generates the high-contrast jewelry environment map (SS-10473).
 *
 *   node scripts/other/generate-jewelry-environment.mjs [--out jewelry_high_contrast.hdr]
 *                                                       [--width 1024] [--scene scene.json]
 *
 * The map is a synthetic light box: a grey room with a ceiling light and
 * narrow strip lights next to black cards. Polished metal mirrors the strips
 * as bright bands and the cards as dark bands. Everything is drawn by this
 * script, so the file can be redistributed. It was tuned on
 * `examples/ijewel-ring` (`capture.mjs --sceneEnv <file>.hdr`).
 *
 * The output is an equirectangular Radiance `.hdr` (RGBE, run-length
 * encoded). The first row is straight up, the centre column is azimuth 0.
 * Upload the file as `jewelry_high_contrast.hdr` to
 * `https://viewer.shapediver.com/v3/envmaps/custom/` after changing it.
 */
import {readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => {
	const index = args.indexOf(`--${name}`);
	return index === -1 ? fallback : args[index + 1];
};
const out = resolve(option("out", "jewelry_high_contrast.hdr"));
const width = Number(option("width", "1024"));
const height = width / 2;

/**
 * The room without lights, as linear radiance by elevation (degrees, 90 is
 * straight up). Values between the stops are interpolated.
 */
const grey = (value) => [value, value, value];
const ROOM = [
	{elevation: -90, color: grey(0.05)},
	{elevation: -20, color: grey(0.14)},
	{elevation: 10, color: grey(0.3)},
	{elevation: 90, color: grey(0.45)},
];

/**
 * The lights, drawn over the room in order. Angles in degrees: `azimuth` and `elevation` are the
 * centre, `width` and `height` the full size, `soft` the width of the edge
 * falloff. A `radius` instead of a size makes a round light around the
 * centre. `color` is linear radiance.
 */
const LIGHTS = [
	// the ceiling light
	{azimuth: 0, elevation: 90, radius: 26, soft: 4, color: grey(3.2)},
	// eight tall strips around the ring, wide and narrow in turn, each with a
	// thin black card next to it: the strips and cards make the light and dark
	// bands that show the grooves of polished metal
	...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => [
		{
			azimuth: i * 45,
			elevation: 14,
			width: i % 2 ? 10 : 16,
			height: i % 2 ? 60 : 86,
			soft: 2,
			color: grey(i % 2 ? 2 : 2.8),
		},
		{
			azimuth: i * 45 + (i % 2 ? 9 : 13),
			elevation: 14,
			width: 5,
			height: 100,
			soft: 1.5,
			color: grey(0.03),
		},
	]),
	// a black line just below the horizon
	{
		azimuth: 0,
		elevation: -12,
		width: 360,
		height: 5,
		soft: 1.5,
		color: grey(0.04),
	},
	// a low fill, so that the underside is not black
	{
		azimuth: 0,
		elevation: -40,
		width: 360,
		height: 16,
		soft: 6,
		color: grey(0.5),
	},
];

// `--scene <file.json>` draws another `{room, lights}` without editing this file
const scene = option("scene")
	? JSON.parse(readFileSync(resolve(option("scene")), "utf8"))
	: {};
const roomStops = scene.room ?? ROOM;
const lights = scene.lights ?? LIGHTS;

const RADIANS = Math.PI / 180;
const smoothstep = (edge0, edge1, x) => {
	const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
};
// 1 inside, 0 outside, with a falloff of `soft` centred on the edge
const edge = (distance, size, soft) =>
	1 - smoothstep(size - soft / 2, size + soft / 2, distance);

const room = (elevation) => {
	for (let i = 1; i < roomStops.length; i++) {
		if (elevation > roomStops[i].elevation) continue;
		const a = roomStops[i - 1];
		const b = roomStops[i];
		const t = smoothstep(a.elevation, b.elevation, elevation);
		return a.color.map((c, k) => c + (b.color[k] - c) * t);
	}
	return roomStops[roomStops.length - 1].color.slice();
};

const lightWeight = (light, azimuth, elevation) => {
	if (light.radius !== undefined) {
		// angle between the direction and the centre of the light
		const cosine =
			Math.sin(elevation * RADIANS) *
				Math.sin(light.elevation * RADIANS) +
			Math.cos(elevation * RADIANS) *
				Math.cos(light.elevation * RADIANS) *
				Math.cos((azimuth - light.azimuth) * RADIANS);
		const angle = Math.acos(Math.min(1, Math.max(-1, cosine))) / RADIANS;
		return edge(angle, light.radius, light.soft);
	}
	let dAzimuth = Math.abs(azimuth - light.azimuth) % 360;
	if (dAzimuth > 180) dAzimuth = 360 - dAzimuth;
	const dElevation = Math.abs(elevation - light.elevation);
	return (
		edge(dAzimuth, light.width / 2, light.soft) *
		edge(dElevation, light.height / 2, light.soft)
	);
};

const pixels = new Float32Array(width * height * 3);
for (let y = 0; y < height; y++) {
	const elevation = 90 - ((y + 0.5) / height) * 180;
	const base = room(elevation);
	for (let x = 0; x < width; x++) {
		const azimuth = ((x + 0.5) / width) * 360 - 180;
		const color = base.slice();
		for (const light of lights) {
			const weight = lightWeight(light, azimuth, elevation);
			if (weight === 0) continue;
			// a light covers the room behind it
			for (let k = 0; k < 3; k++)
				color[k] += (light.color[k] - color[k]) * weight;
		}
		pixels.set(color, (y * width + x) * 3);
	}
}

// Radiance RGBE: three mantissas and a shared exponent per pixel
const toRgbe = (r, g, b, target, offset) => {
	const max = Math.max(r, g, b);
	if (max < 1e-32) {
		target.fill(0, offset, offset + 4);
		return;
	}
	const exponent = Math.ceil(Math.log2(max));
	// max / 2^exponent is in (0.5, 1], so the largest mantissa is at most 255
	const scale = 255.9999 / Math.pow(2, exponent);
	target[offset] = Math.min(255, Math.floor(r * scale));
	target[offset + 1] = Math.min(255, Math.floor(g * scale));
	target[offset + 2] = Math.min(255, Math.floor(b * scale));
	target[offset + 3] = exponent + 128;
};

// run-length encoding of one channel of a scanline
const encodeChannel = (data, output) => {
	let i = 0;
	while (i < data.length) {
		let run = 1;
		while (i + run < data.length && run < 127 && data[i + run] === data[i])
			run++;
		if (run >= 3) {
			output.push(128 + run, data[i]);
			i += run;
			continue;
		}
		// literal bytes up to the next run of at least three
		const start = i;
		while (i < data.length && i - start < 128) {
			if (
				i + 2 < data.length &&
				data[i] === data[i + 1] &&
				data[i] === data[i + 2]
			)
				break;
			i++;
		}
		output.push(i - start);
		for (let k = start; k < i; k++) output.push(data[k]);
	}
};

const header = `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`;
const body = [];
const scanline = new Uint8Array(width * 4);
const channel = new Uint8Array(width);
for (let y = 0; y < height; y++) {
	for (let x = 0; x < width; x++) {
		const p = (y * width + x) * 3;
		toRgbe(pixels[p], pixels[p + 1], pixels[p + 2], scanline, x * 4);
	}
	body.push(2, 2, width >> 8, width & 255);
	for (let k = 0; k < 4; k++) {
		for (let x = 0; x < width; x++) channel[x] = scanline[x * 4 + k];
		encodeChannel(channel, body);
	}
}

writeFileSync(
	out,
	Buffer.concat([Buffer.from(header, "ascii"), Buffer.from(body)]),
);
console.log(`saved ${out} (${width} x ${height})`);
