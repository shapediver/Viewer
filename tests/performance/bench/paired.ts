import type {CDPSession} from "@playwright/test";

/**
 * Statistics and the CPU clock shared by the timing benchmarks
 * (`timing.bench.ts`, `instancing.bench.ts`). See README.md.
 */

const sorted = (values: number[]) =>
	values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);

export function quantile(values: number[], q: number) {
	const s = sorted(values);
	if (!s.length) return NaN;
	const index = (s.length - 1) * q;
	const low = Math.floor(index);
	const high = Math.ceil(index);
	return s[low] + (s[high] - s[low]) * (index - low);
}

export const median = (values: number[]) => quantile(values, 0.5);

/**
 * Main-thread CPU time of `run`, in ms. With `timeDomain: "threadTicks"`
 * Chrome reports `TaskDuration` as CPU time of the page's main thread, so
 * time the thread waits for a core, for the network or for the GPU does not
 * count. It covers every task on the thread in between, so the measured
 * section runs synchronously in one `evaluate`.
 */
export async function cpuOf<T>(cdp: CDPSession, run: () => Promise<T>) {
	const read = async () => {
		const {metrics} = await cdp.send("Performance.getMetrics");
		const task = metrics.find((metric) => metric.name === "TaskDuration");
		if (!task)
			throw new Error("Performance.getMetrics has no TaskDuration");
		return task.value * 1000;
	};
	const before = await read();
	const result = await run();
	return {cpu: (await read()) - before, result};
}

// Two-sided 95% Student t quantiles by degrees of freedom.
const T95 = [
	NaN,
	12.71,
	4.303,
	3.182,
	2.776,
	2.571,
	2.447,
	2.365,
	2.306,
	2.262,
	2.228,
	2.201,
	2.179,
	2.16,
	2.145,
	2.131,
	2.12,
	2.11,
	2.101,
	2.093,
	2.086,
];

/**
 * Change of `b` against `a`. Within a round the blocks of the two pages ran
 * seconds apart, so each round gives one ratio: the median of its block
 * ratios. The result is the geometric mean of the round ratios with a 95%
 * confidence interval across rounds.
 */
export function pairedChange(a: number[][], b: number[][]) {
	const logs: number[] = [];
	for (let r = 0; r < Math.min(a.length, b.length); r++) {
		const ratios = a[r].map((value, block) => b[r][block] / value);
		const ratio = median(ratios.filter((value) => value > 0));
		if (Number.isFinite(ratio)) logs.push(Math.log(ratio));
	}
	const n = logs.length;
	if (n < 2) return {change: NaN, low: NaN, high: NaN};
	const mean = logs.reduce((sum, value) => sum + value, 0) / n;
	const variance =
		logs.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1);
	const half = (T95[n - 1] ?? 1.96) * Math.sqrt(variance / n);
	return {
		change: Math.exp(mean) - 1,
		low: Math.exp(mean - half) - 1,
		high: Math.exp(mean + half) - 1,
	};
}

export type Change = ReturnType<typeof pairedChange>;

export const ms = (value: number) =>
	Number.isFinite(value) ? value.toFixed(2) : "-";
export const percent = (value: number) =>
	Number.isFinite(value)
		? `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`
		: "-";
export const interval = (c: Change) =>
	`${percent(c.change)} (${percent(c.low)} to ${percent(c.high)})`;

export function verdict(c: Change) {
	if (!Number.isFinite(c.low)) return "-";
	if (c.low <= 0 && c.high >= 0) return "not distinguishable";
	return c.change < 0 ? "faster" : "slower";
}
