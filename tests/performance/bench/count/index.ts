import * as attributeShow from "./attributeShow";
import * as attributeSwitch from "./attributeSwitch";
import * as batchedMemberHidden from "./batchedMemberHidden";
import * as batchedMemberReplaced from "./batchedMemberReplaced";
import * as batchedMemberVersioned from "./batchedMemberVersioned";
import * as build from "./build";
import type {Counts, Viewer} from "./context";
import * as gltfDraco from "./gltfDraco";
import * as gltfPlain from "./gltfPlain";
import * as oneNodeUpdate from "./oneNodeUpdate";
import * as renderFrame from "./renderFrame";
import * as ssaoFrame from "./ssaoFrame";
import * as versionUpdate from "./versionUpdate";

/**
 * Every section of the work-count benchmark, in the order a page runs them:
 * name, label, the function that counts it, and whether it needs a page of
 * its own. A section is one line here and one file next to this one.
 */
export const ALL_SECTIONS = [
	["build", build.label, build.run],
	["renderFrame", renderFrame.label, renderFrame.run],
	["oneNodeUpdate", oneNodeUpdate.label, oneNodeUpdate.run],
	["batchedMemberHidden", batchedMemberHidden.label, batchedMemberHidden.run],
	[
		"batchedMemberReplaced",
		batchedMemberReplaced.label,
		batchedMemberReplaced.run,
	],
	[
		"batchedMemberVersioned",
		batchedMemberVersioned.label,
		batchedMemberVersioned.run,
	],
	["ssaoFrame", ssaoFrame.label, ssaoFrame.run],
	["gltfPlain", gltfPlain.label, gltfPlain.run],
	["gltfDraco", gltfDraco.label, gltfDraco.run],
	["versionUpdate", versionUpdate.label, versionUpdate.run],
	["attributeShow", attributeShow.label, attributeShow.run, true],
	["attributeSwitch", attributeSwitch.label, attributeSwitch.run, true],
] as const satisfies readonly (readonly [
	string,
	string,
	(viewer: Viewer) => Promise<Counts>,
	boolean?,
])[];
export type Section = (typeof ALL_SECTIONS)[number][0];
