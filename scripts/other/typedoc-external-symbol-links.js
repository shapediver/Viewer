/**
 * Documentation targets for dependency types that are intentionally not
 * included in the Viewer API reference.
 */
module.exports = {
	"@types/node": {
		"*": "https://nodejs.org/api/",
	},
	"@types/three": {
		"*": "https://threejs.org/docs/",
	},
	"@shapediver/sdk.geometry-api-sdk-v2": {
		"*": "https://www.npmjs.com/package/@shapediver/sdk.geometry-api-sdk-v2",
	},
	"@shapediver/sdk.sdtf-core": {
		"*": "https://www.npmjs.com/package/@shapediver/sdk.sdtf-core",
	},
	"@shapediver/sdk.sdtf-primitives": {
		"*": "https://www.npmjs.com/package/@shapediver/sdk.sdtf-primitives",
	},
	"@shapediver/sdk.sdtf-v1": {
		"*": "https://www.npmjs.com/package/@shapediver/sdk.sdtf-v1",
	},
	"gl-matrix": {
		"*": "https://glmatrix.net/docs/",
	},
	postprocessing: {
		"*": "https://pmndrs.github.io/postprocessing/public/docs/",
		Resizer: "https://pmndrs.github.io/postprocessing/public/docs/",
		Resolution: "https://pmndrs.github.io/postprocessing/public/docs/",
	},
	Resizer: {
		"*": "https://pmndrs.github.io/postprocessing/public/docs/",
		AUTO_SIZE: "https://pmndrs.github.io/postprocessing/public/docs/",
	},
	zod: {
		"*": "https://zod.dev/",
	},
	// Internal package cross-references for sub-package documentation
	// These are needed because each sub-package runs its own typedoc process
	// and doesn't generate pages for types from other packages.
	"@shapediver/viewer": {
		ISessionApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/ISessionApi.html",
		IViewportApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/IViewportApi.html",
		IPostProcessingApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/IPostProcessingApi.html",
		ICameraApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/ICameraApi.html",
		Settings:
			"https://viewer.shapediver.com/v3/latest/api/types/Settings.html",
		IAmbientLightApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/IAmbientLightApi.html",
		IDirectionalLightApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/IDirectionalLightApi.html",
		IHemisphereLightApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/IHemisphereLightApi.html",
		ILightSceneApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/ILightSceneApi.html",
		IOrthographicCameraApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/IOrthographicCameraApi.html",
		IPerspectiveCameraApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/IPerspectiveCameraApi.html",
		IPointLightApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/IPointLightApi.html",
		ISpotLightApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/ISpotLightApi.html",
		createViewport:
			"https://viewer.shapediver.com/v3/latest/api/modules.html#createViewport",
		ENVIRONMENT_MAP:
			"https://viewer.shapediver.com/v3/latest/api/variables/ENVIRONMENT_MAP.html",
		ENVIRONMENT_MAP_CUBE:
			"https://viewer.shapediver.com/v3/latest/api/variables/ENVIRONMENT_MAP_CUBE.html",
		GeometryData:
			"https://viewer.shapediver.com/v3/latest/api/classes/GeometryData.html",
	},
	"@shapediver/viewer.viewport": {
		IPostProcessingApi:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/IPostProcessingApi.html",
	},
	"@shapediver/viewer.shared.types": {
		SESSION_SETTINGS_MODE:
			"https://viewer.shapediver.com/v3/latest/api/enums/SESSION_SETTINGS_MODE.html",
		"SESSION_SETTINGS_MODE.MANUAL":
			"https://viewer.shapediver.com/v3/latest/api/enums/SESSION_SETTINGS_MODE.html",
		"SESSION_SETTINGS_MODE.FIRST":
			"https://viewer.shapediver.com/v3/latest/api/enums/SESSION_SETTINGS_MODE.html",
		"SESSION_SETTINGS_MODE.SESSION":
			"https://viewer.shapediver.com/v3/latest/api/enums/SESSION_SETTINGS_MODE.html",
		VISIBILITY_MODE:
			"https://viewer.shapediver.com/v3/latest/api/enums/VISIBILITY_MODE.html",
		"VISIBILITY_MODE.MANUAL":
			"https://viewer.shapediver.com/v3/latest/api/enums/VISIBILITY_MODE.html",
		"VISIBILITY_MODE.SESSIONS":
			"https://viewer.shapediver.com/v3/latest/api/enums/VISIBILITY_MODE.html",
		ISDTFItemData:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/ISDTFItemData.html",
		ISDTFAttributeVisualizationData:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/ISDTFAttributeVisualizationData.html",
		ISDTFOverview:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/ISDTFOverview.html",
		IDrawingParameterSettings:
			"https://viewer.shapediver.com/v3/latest/api/interfaces/IDrawingParameterSettings.html",
		ITree: "https://viewer.shapediver.com/v3/latest/api/interfaces/ITree.html",
	},
	"@shapediver/viewer.shared.node-tree": {
		GeometryData:
			"https://viewer.shapediver.com/v3/latest/api/classes/GeometryData.html",
	},
};
