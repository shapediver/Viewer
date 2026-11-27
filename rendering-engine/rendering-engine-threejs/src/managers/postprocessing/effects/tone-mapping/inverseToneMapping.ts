import {TONE_MAPPING} from "@shapediver/viewer.shared.types";

type Vec3 = [number, number, number];

/** The largest value the inverse returns, for targets the curve never reaches. */
const MAX_VALUE = 64;

const saturate = (x: number) => Math.min(1, Math.max(0, x));

/** `mat3(c0, c1, c2) * v` with the columns as in GLSL. */
const mul = (m: readonly Vec3[], v: Vec3): Vec3 => [
	m[0][0] * v[0] + m[1][0] * v[1] + m[2][0] * v[2],
	m[0][1] * v[0] + m[1][1] * v[1] + m[2][1] * v[2],
	m[0][2] * v[0] + m[1][2] * v[1] + m[2][2] * v[2],
];

// The operators of three.js (tonemapping_pars_fragment), which the
// ToneMappingEffect uses: linear sRGB in, linear sRGB out.

const ACES_INPUT: readonly Vec3[] = [
	[0.59719, 0.076, 0.0284],
	[0.35458, 0.90834, 0.13383],
	[0.04823, 0.01566, 0.83777],
];
const ACES_OUTPUT: readonly Vec3[] = [
	[1.60475, -0.10208, -0.00327],
	[-0.53108, 1.10813, -0.07276],
	[-0.07367, -0.00605, 1.07602],
];
const REC2020_TO_SRGB: readonly Vec3[] = [
	[1.6605, -0.1246, -0.0182],
	[-0.5876, 1.1329, -0.1006],
	[-0.0728, -0.0083, 1.1187],
];
const SRGB_TO_REC2020: readonly Vec3[] = [
	[0.6274, 0.0691, 0.0164],
	[0.3293, 0.9195, 0.088],
	[0.0433, 0.0113, 0.8956],
];
const AGX_INSET: readonly Vec3[] = [
	[0.856627153315983, 0.137318972929847, 0.11189821299995],
	[0.0951212405381588, 0.761241990602591, 0.0767994186031903],
	[0.0482516061458583, 0.101439036467562, 0.811302368396859],
];
const AGX_OUTSET: readonly Vec3[] = [
	[1.1271005818144368, -0.1413297634984383, -0.14132976349843826],
	[-0.11060664309660323, 1.157823702216272, -0.11060664309660294],
	[-0.016493938717834573, -0.016493938717834257, 1.2519364065950405],
];

const aces = (c: Vec3): Vec3 => {
	const fit = (v: number) =>
		(v * (v + 0.0245786) - 0.000090537) /
		(v * (0.983729 * v + 0.432951) + 0.238081);
	const v = mul(ACES_INPUT, c.map((x) => x / 0.6) as Vec3);
	return mul(ACES_OUTPUT, v.map(fit) as Vec3).map(saturate) as Vec3;
};

const agx = (c: Vec3): Vec3 => {
	const minEv = -12.47393;
	const maxEv = 4.026069;
	const contrast = (x: number) => {
		const x2 = x * x;
		const x4 = x2 * x2;
		return (
			15.5 * x4 * x2 -
			40.14 * x4 * x +
			31.96 * x4 -
			6.868 * x2 * x +
			0.4298 * x2 +
			0.1191 * x -
			0.00232
		);
	};
	const v = mul(AGX_INSET, mul(SRGB_TO_REC2020, c)).map((x) =>
		contrast(
			saturate((Math.log2(Math.max(x, 1e-10)) - minEv) / (maxEv - minEv)),
		),
	) as Vec3;
	const linear = mul(AGX_OUTSET, v).map((x) =>
		Math.pow(Math.max(0, x), 2.2),
	) as Vec3;
	return mul(REC2020_TO_SRGB, linear).map(saturate) as Vec3;
};

const neutral = (c: Vec3): Vec3 => {
	const startCompression = 0.8 - 0.04;
	const desaturation = 0.15;
	const x = Math.min(c[0], c[1], c[2]);
	const offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	const v = c.map((y) => y - offset) as Vec3;
	const peak = Math.max(v[0], v[1], v[2]);
	if (peak < startCompression) return v;
	const d = 1 - startCompression;
	const newPeak = 1 - (d * d) / (peak + d - startCompression);
	const g = 1 - 1 / (desaturation * (peak - newPeak) + 1);
	return v.map(
		(y) => (y * newPeak) / peak + (newPeak - (y * newPeak) / peak) * g,
	) as Vec3;
};

/**
 * The tone mapping curve of `mode` (without the exposure), or undefined when
 * the mode does not tone-map.
 */
const toneMappingCurve = (
	mode: TONE_MAPPING,
): ((c: Vec3) => Vec3) | undefined => {
	switch (mode) {
		case TONE_MAPPING.LINEAR:
			return (c) => c.map(saturate) as Vec3;
		case TONE_MAPPING.REINHARD:
			return (c) => c.map((x) => saturate(x / (1 + x))) as Vec3;
		case TONE_MAPPING.CINEON:
			return (c) =>
				c.map((x) => {
					const y = Math.max(0, x - 0.004);
					return Math.pow(
						(y * (6.2 * y + 0.5)) / (y * (6.2 * y + 1.7) + 0.06),
						2.2,
					);
				}) as Vec3;
		case TONE_MAPPING.ACES_FILMIC:
			return aces;
		case TONE_MAPPING.AGX:
			return agx;
		case TONE_MAPPING.NEUTRAL:
			return neutral;
		case TONE_MAPPING.NONE:
			return undefined;
	}
};

/**
 * The HDR colour that the tone mapping of `mode` and `exposure` maps to
 * `target` (linear sRGB), so a background stored with it shows `target`
 * after the tone mapping. Channels the curve never reaches stop at
 * {@link MAX_VALUE}. Without tone mapping, `target` is returned unchanged.
 */
export const inverseToneMapping = (
	target: Vec3,
	mode: TONE_MAPPING,
	exposure: number,
): Vec3 => {
	const curve = toneMappingCurve(mode);
	if (!curve || !(exposure > 0)) return [...target];

	// solve curve(x) = target for x (before the exposure). Each curve rises
	// with its own channel and depends little on the others: bisect one
	// channel at a time and sweep until all three agree.
	const t = target.map((v) => saturate(v)) as Vec3;
	const x = [...t] as Vec3;
	for (let sweep = 0; sweep < 32; sweep++) {
		for (let k = 0; k < 3; k++) {
			const at = (v: number) => {
				const probe = [...x] as Vec3;
				probe[k] = v;
				return curve(probe)[k];
			};
			if (at(MAX_VALUE) < t[k]) {
				x[k] = MAX_VALUE;
				continue;
			}
			let low = 0;
			let high = MAX_VALUE;
			for (let i = 0; i < 60; i++) {
				const mid = (low + high) / 2;
				if (at(mid) < t[k]) low = mid;
				else high = mid;
			}
			x[k] = high;
		}
		const y = curve(x);
		if (Math.max(...y.map((v, k) => Math.abs(v - t[k]))) < 1e-7) break;
	}
	return x.map((v) => Math.min(MAX_VALUE, v / exposure)) as Vec3;
};
