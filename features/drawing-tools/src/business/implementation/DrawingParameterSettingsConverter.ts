import {type RestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {type IDrawingParameterSettings} from "@shapediver/viewer.shared.types";
import {type SettingsOptional} from "../interfaces/IDrawingToolsManager";

export const DEFAULT_AUTOMATIC_SCENE_UPDATE_TIMEOUT = 1000;
export const LEGACY_AUTO_UPDATE_TIMEOUT = 0;

type DrawingAutomaticSceneUpdateInput = {
	autoUpdate?: boolean | null;
	automaticSceneUpdate?: boolean | null;
	automaticSceneUpdateTimeout?: number | null;
};

const isSet = (value: unknown): boolean =>
	value !== undefined && value !== null;

/**
 * Resolve drawing idle-update flags.
 *
 * `automaticSceneUpdate` wins when present. Deprecated `autoUpdate` is still
 * honored otherwise. Timeout defaults to 1000 when `automaticSceneUpdate` is
 * set, and to 0 when only `autoUpdate` is set.
 */
export const resolveDrawingAutomaticSceneUpdate = (
	input?: DrawingAutomaticSceneUpdateInput | null,
): {enabled: boolean; timeout: number} => {
	const hasAutomaticSceneUpdate = isSet(input?.automaticSceneUpdate);
	const hasAutoUpdate = isSet(input?.autoUpdate);
	const enabled = hasAutomaticSceneUpdate
		? Boolean(input!.automaticSceneUpdate)
		: Boolean(input?.autoUpdate);
	const timeoutDefault = hasAutomaticSceneUpdate
		? DEFAULT_AUTOMATIC_SCENE_UPDATE_TIMEOUT
		: hasAutoUpdate
			? LEGACY_AUTO_UPDATE_TIMEOUT
			: DEFAULT_AUTOMATIC_SCENE_UPDATE_TIMEOUT;
	const timeout = isSet(input?.automaticSceneUpdateTimeout)
		? Number(input!.automaticSceneUpdateTimeout)
		: timeoutDefault;
	return {enabled, timeout};
};

/**
 * Converts platform-level drawing parameter settings ({@link IDrawingParameterSettings})
 * to the runtime settings format ({@link SettingsOptional}) consumed by the drawing tools engine.
 *
 * This centralizes the bridging logic that was previously duplicated in consumer code
 * (e.g. the AppBuilder SDK's `useDrawingTools` hook).
 *
 * @param paramSettings - The platform-level parameter settings.
 * @param resolvedRestrictions - Pre-resolved restriction properties, keyed by token.
 *   Use the restriction resolution helpers from the interaction/restriction packages.
 * @param initialPoints - Optional initial point data (overrides `paramSettings.geometry.points`).
 * @returns A {@link SettingsOptional} object ready for {@link createDrawingTools}.
 */
export const drawingParameterToRuntimeSettings = (
	paramSettings: IDrawingParameterSettings,
	resolvedRestrictions?: Partial<{[key: string]: RestrictionProperties}>,
	initialPoints?: number[][],
): SettingsOptional => {
	const behavior = paramSettings.behavior;
	const geometry = paramSettings.geometry;
	const options = paramSettings.general?.options;
	const {enabled: automaticSceneUpdate, timeout: automaticSceneUpdateTimeout} =
		resolveDrawingAutomaticSceneUpdate(behavior);

	return {
		controls: paramSettings.controls as SettingsOptional["controls"],
		general: {
			autoStart: behavior?.autoStart ?? true,
			autoUpdate: automaticSceneUpdate,
			automaticSceneUpdate,
			automaticSceneUpdateTimeout,
			closeOnUpdate: behavior?.closeOnUpdate ?? false,
			displayUnit: behavior?.displayUnit ?? "",
			enableTranslation: behavior?.enableTranslation ?? true,
			enableInsertion: behavior?.enableInsertion ?? true,
			enableDeletion: behavior?.enableDeletion ?? true,
			enableSelection: behavior?.enableSelection ?? true,
		},
		geometry: {
			points: initialPoints ?? geometry?.points ?? [],
			mode: geometry?.mode ?? "lines",
			minPoints: geometry?.minPoints,
			maxPoints: geometry?.maxPoints,
			strictMinMaxPoints: geometry?.strictMinMaxPoints ?? true,
			close: geometry?.close ?? true,
			autoClose: geometry?.autoClose ?? true,
			weightedAdjacency: geometry?.weightedAdjacency,
			disabledPoints: geometry?.disabledPoints,
			constraints: geometry?.constraints,
		},
		keyBindings: paramSettings.keyBindings,
		restrictions: applySnapDefaults(resolvedRestrictions, options),
		visualization: paramSettings.visualization,
	};
};

/**
 * Applies global snap defaults from general.options to geometry restrictions
 * that don't already have per-restriction values set.
 */
const applySnapDefaults = (
	restrictions: Partial<{[key: string]: RestrictionProperties}> | undefined,
	options: NonNullable<IDrawingParameterSettings["general"]>["options"],
): Partial<{[key: string]: RestrictionProperties}> | undefined => {
	if (!restrictions || !options) return restrictions;

	for (const key of Object.keys(restrictions)) {
		const r = restrictions[key];
		if (!r || !("nodes" in r)) continue; // only geometry restrictions have nodes

		if (
			options.snapToVertices !== undefined &&
			r.snapToVertices === undefined
		)
			r.snapToVertices = options.snapToVertices;
		if (options.snapToEdges !== undefined && r.snapToEdges === undefined)
			r.snapToEdges = options.snapToEdges;
		if (options.snapToFaces !== undefined && r.snapToFaces === undefined)
			r.snapToFaces = options.snapToFaces;
	}

	return restrictions;
};
