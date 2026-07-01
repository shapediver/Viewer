import {type IRenderingEngine} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {SDTFItemData} from "@shapediver/viewer.shared.node-tree";
import {
	type Color,
	type ISDTFAttributeVisualizationData,
	type ISDTFOverview,
	MATERIAL_TYPE,
	TEXTURE_ENCODING,
	TONE_MAPPING} from "@shapediver/viewer.shared.types";
import {quat} from "gl-matrix";
import * as THREE from "three";

export interface IRenderingEngineThreeJS extends IRenderingEngine {
	// #region Properties (33)

	automaticColorAdjustment: boolean;
	beautyRenderBlendingDuration: number;
	beautyRenderDelay: number;
	clearAlpha: number;
	clearColor: Color;
	defaultMaterialColor: Color;
	environmentMap: string | string[];
	environmentMapAsBackground: boolean;
	environmentMapBlurriness: number;
	environmentMapForUnlitMaterials: boolean;
	environmentMapIntensity: number;
	environmentMapResolution: string;
	environmentMapRotation: quat;
	gridColor: Color;
	gridVisibility: boolean;
	groundPlaneColor: Color;
	groundPlaneShadowColor: Color;
	groundPlaneShadowVisibility: boolean;
	groundPlaneVisibility: boolean;
	lightSceneId: string;
	lights: boolean;
	loadDefaultCameras: boolean;
	materialOverrideType: MATERIAL_TYPE | undefined;
	maximumRenderingSize: {
		width: number;
		height: number;
	};

	outputEncoding: TEXTURE_ENCODING;
	physicallyCorrectLights: boolean;
	postRenderCallback?: (
		renderer: THREE.WebGLRenderer,
		scene: THREE.Scene,
		camera: THREE.Camera,
	) => void;
	preRenderCallback?: (renderer: THREE.WebGLRenderer) => void;
	shadows: boolean;
	softShadows: boolean;
	textureEncoding: TEXTURE_ENCODING;
	toneMapping: TONE_MAPPING;
	toneMappingExposure: number;
	visualizeAttributes:
		| ((
				overview: ISDTFOverview,
				itemData?: SDTFItemData,
		  ) => ISDTFAttributeVisualizationData)
		| undefined;

	// #endregion Properties (33)

	// #region Public Methods (1)

	updateEnvironmentGeometry(): void;

	// #endregion Public Methods (1)
}
