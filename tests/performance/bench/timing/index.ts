import {build} from "./build";
import type {Clock, Viewer} from "./common";
import {SSAO_BLOCKS, ssaoBlock} from "./composerFrame";
import {firstFrame} from "./firstFrame";
import {UPDATE_BLOCKS, updateBlock} from "./oneNodeUpdate";
import {RENDER_BLOCKS, renderBlock} from "./renderFrame";
import {VERSION_BLOCKS, versionBlock} from "./versionUpdate";

/**
 * Name, label, and the clock the main table uses. The first frame uses CPU
 * time although shader compilation runs in the GPU process: the three pages
 * share that process and its program cache, so the wall time of a first
 * frame depends on which page compiled first and was twice as noisy.
 */
export const METRICS = [
	["build", "Full scene build (tree + conversion)", "cpu"],
	["firstFrame", "First frame", "cpu"],
	["renderFrame", "Camera frame, renderer.render", "cpu"],
	["oneNodeUpdate", "One-node scene update", "cpu"],
	["composerFrame", "Camera frame with SSAO, until the GPU is done", "wall"],
	["versionUpdate", "Fixture version update", "cpu"],
	[
		"aoFrame",
		"Camera frame with SSAO, close-up at 1920x1080, until the GPU is done",
		"wall",
	],
] as const;
export type Metric = (typeof METRICS)[number][0];

/**
 * The pages take turns block by block. Many short blocks pair better than a
 * few long ones: load from other programs comes in bursts of seconds.
 * Update and SSAO blocks wait for the beauty render afterwards, so they are
 * fewer. A metric is one line here, in the order a round runs them, plus the
 * line in `METRICS` above.
 */
export const STEPS: [
	Metric,
	(viewer: Viewer) => Promise<Record<Clock, number>>,
	number,
][] = [
	["build", build, 1],
	["firstFrame", firstFrame, 1],
	["renderFrame", renderBlock, RENDER_BLOCKS],
	["oneNodeUpdate", updateBlock, UPDATE_BLOCKS],
	["composerFrame", ssaoBlock, SSAO_BLOCKS],
	["versionUpdate", versionBlock, VERSION_BLOCKS],
	["aoFrame", ssaoBlock, SSAO_BLOCKS],
];
