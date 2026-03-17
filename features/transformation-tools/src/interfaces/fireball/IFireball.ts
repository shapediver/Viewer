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
	enableCornerXNegativeYNegative: boolean; // C0: BL
	enableCornerXPositiveYNegative: boolean; // C2: BR
	enableCornerXPositiveYPositive: boolean; // C4: TR
	enableCornerXNegativeYPositive: boolean; // C6: TL
	enableMidpointXPositive: boolean;
	enableMidpointXNegative: boolean;
	enableMidpointYPositive: boolean;
	enableMidpointYNegative: boolean;
} & Settings;

export type FireballSettingsOptional = Partial<FireballSettings>;
