import {PlaneRestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	ITransformationToolsManager,
	Settings,
} from "../ITransformationToolsManager";

export interface IFireball extends ITransformationToolsManager {}

export type FireballSettings = {
	plane: PlaneRestrictionProperties;
	enableUniformScaling: boolean;
	enableRotation: boolean;
	showMidpointsX: boolean;
	showMidpointsY: boolean;
} & Settings;

export type FireballSettingsOptional = Partial<FireballSettings>;
