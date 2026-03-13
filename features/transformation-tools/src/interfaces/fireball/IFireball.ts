import {PlaneRestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	ITransformationToolsManager,
	Settings,
} from "../ITransformationToolsManager";

export interface IFireball extends ITransformationToolsManager {}

export type FireballSettings = {
	plane: PlaneRestrictionProperties;
} & Settings;

export type FireballSettingsOptional = Partial<FireballSettings>;
