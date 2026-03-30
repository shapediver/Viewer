import {SdtfPrimitiveTypeGuard} from "@shapediver/sdk.sdtf-primitives";
import {SdtfTypeHintName} from "@shapediver/sdk.sdtf-v1";

import {
	IAnimationData,
	IAnimationTrack,
} from "./interfaces/data/IAnimationData";
import {IChunkData} from "./interfaces/data/IChunkData";
import {ICustomData} from "./interfaces/data/ICustomData";
import {
	IAttributeData,
	IGeometryData,
	IPrimitiveData,
	PRIMITIVE_MODE,
} from "./interfaces/data/IGeometryData";
import {
	IAnchorDataImage,
	IAnchorDataText,
	IHTMLElementAnchorData,
	IHTMLElementAnchorUpdateProperties,
} from "./interfaces/data/IHTMLElementAnchorData";
import {IInstanceData} from "./interfaces/data/IInstanceData";
import {
	IMapData,
	IMapDataProperties,
	IMapDataPropertiesDefinition,
	TEXTURE_FILTERING,
	TEXTURE_WRAPPING,
} from "./interfaces/data/material/IMapData";
import {
	IMaterialAbstractData,
	IMaterialAbstractDataProperties,
	IMaterialAbstractDataPropertiesDefinition,
	MATERIAL_ALPHA,
	MATERIAL_SHADING,
	MATERIAL_SIDE,
	MATERIAL_TYPE,
} from "./interfaces/data/material/IMaterialAbstractData";
import {
	IMaterialBasicLineData,
	IMaterialBasicLineDataProperties,
	IMaterialBasicLineDataPropertiesDefinition,
} from "./interfaces/data/material/IMaterialBasicLineData";
import {
	IMaterialGemData,
	IMaterialGemDataProperties,
	IMaterialGemDataPropertiesDefinition,
} from "./interfaces/data/material/IMaterialGemDataProperties";
import {
	IMaterialLambertData,
	IMaterialLambertDataProperties,
	IMaterialLambertDataPropertiesDefinition,
} from "./interfaces/data/material/IMaterialLambertData";
import {
	IMaterialMultiPointData,
	IMaterialMultiPointDataProperties,
	IMaterialMultiPointDataPropertiesDefinition,
} from "./interfaces/data/material/IMaterialMultiPointData";
import {
	IMaterialPhongData,
	IMaterialPhongDataProperties,
	IMaterialPhongDataPropertiesDefinition,
} from "./interfaces/data/material/IMaterialPhongData";
import {
	IMaterialPointData,
	IMaterialPointDataProperties,
	IMaterialPointDataPropertiesDefinition,
} from "./interfaces/data/material/IMaterialPointData";
import {
	IMaterialShadowData,
	IMaterialShadowDataProperties,
	IMaterialShadowDataPropertiesDefinition,
} from "./interfaces/data/material/IMaterialShadowData";
import {
	IMaterialSpecularGlossinessData,
	IMaterialSpecularGlossinessDataProperties,
	IMaterialSpecularGlossinessDataPropertiesDefinition,
} from "./interfaces/data/material/IMaterialSpecularGlossinessDataProperties";
import {
	IMaterialStandardData,
	IMaterialStandardDataProperties,
	IMaterialStandardDataPropertiesDefinition,
} from "./interfaces/data/material/IMaterialStandardData";
import {
	IMaterialUnlitData,
	IMaterialUnlitDataProperties,
	IMaterialUnlitDataPropertiesDefinition,
} from "./interfaces/data/material/IMaterialUnlitData";
import {IMaterialVariantsData} from "./interfaces/data/material/IMaterialVariantsData";
import {EventResponseMapping} from "./interfaces/events/EventResponseMapping";
import {ICameraEvent} from "./interfaces/events/ICameraEvent";
import {IOutputEvent} from "./interfaces/events/IOutputEvent";
import {IParameterEvent} from "./interfaces/events/IParameterEvent";
import {IRenderingEvent} from "./interfaces/events/IRenderingEvent";
import {ISceneEvent} from "./interfaces/events/ISceneEvent";
import {
	ISessionErrorEvent,
	ISessionEvent,
} from "./interfaces/events/ISessionEvent";
import {
	ITaskEvent,
	ITaskEventDescription,
	TaskCategoryTypes,
	TASK_CATEGORY,
	TASK_CATEGORY_SESSION_CUSTOMIZATION_CATEGORY,
	TASK_TYPE,
} from "./interfaces/events/ITaskEvent";
import {IViewportEvent} from "./interfaces/events/IViewportEvent";
import {
	DraggingParameterValue,
	IDraggableObject,
	IDraggingParameterProps,
} from "./interfaces/parameter/IDraggingParameterSettings";
import {
	DrawingParameterValue,
	IDrawingParameterJsonSchema,
	IDrawingParameterSettings,
	IVisualizationSettings,
	validateDrawingParameterSettings,
} from "./interfaces/parameter/IDrawingParametersSettings";
import {
	GumballTransformParameterValue,
	IGumballTransformParameterProps,
} from "./interfaces/parameter/IGumballTransformParameterSettings";
import {
	IDraggingParameterJsonSchema,
	IDraggingParameterPropsJsonSchema,
	IGumballTransformParameterJsonSchema,
	IGumballTransformParameterPropsJsonSchema,
	IInteractionParameterJsonSchema,
	IInteractionParameterProps,
	IInteractionParameterSettings,
	InteractionEffect,
	InteractionParameterSettingsType,
	IRectangleTransformParameterJsonSchema,
	IRectangleTransformParameterPropsJsonSchema,
	ISelectionParameterJsonSchema,
	ISelectionParameterPropsJsonSchema,
	validateDraggingParameterSettings,
	validateGumballTransformParameterSettings,
	validateInteractionParameterSettings,
	validateRectangleTransformParameterSettings,
	validateSelectionParameterSettings,
} from "./interfaces/parameter/IInteractionParameterSettings";
import {
	RestrictionDefinition,
	Rotation,
} from "./interfaces/parameter/IRestrictionSettings";
import {
	ISelectionParameterProps,
	SelectionParameterValue,
} from "./interfaces/parameter/ISelectionParameterSettings";
import {
	BUSY_MODE_DISPLAY,
	FLAG_TYPE,
	RENDERER_TYPE,
	SPINNER_POSITIONING,
	TEXTURE_ENCODING,
	TONE_MAPPING,
	VISIBILITY_MODE,
} from "./interfaces/renderingEngine/enums";
import {
	IBoxSelectionIntersection,
	IIntersectionDefinition,
	IRayTracingIntersection,
} from "./interfaces/renderingEngine/IIntersection";
import {IIntersectionFilter} from "./interfaces/renderingEngine/IIntersectionFilter";
import {IRay} from "./interfaces/renderingEngine/IRay";
import {
	ISDTFAttributeData,
	ISDTFAttributesData,
} from "./interfaces/sdtf/ISDTFAttributesData";
import {ISDTFAttributeVisualizationData} from "./interfaces/sdtf/ISDTFAttributeVisualizationData";
import {ISDTFItemData} from "./interfaces/sdtf/ISDTFItemData";
import {
	ISDTFOverview,
	ISDTFOverviewData,
} from "./interfaces/sdtf/ISDTFOverviewData";
import {
	Color,
	ISessionSettingsSections,
	ISettingsSections,
	IViewportSettingsSections,
	PARAMETER_TYPE,
	PARAMETER_VISUALIZATION,
	SDImageBitmap,
	SessionCreationDefinition,
	ViewportCreationDefinition,
} from "./types";

import {
	ATTRIBUTE_VISUALIZATION,
	Gradient,
	IGradient,
	INumberGradient,
	IStringGradient,
} from "./interfaces/attribute-visualization";
import {
	IRectangleTransformParameterProps,
	RectangleTransformParameterValue,
} from "./interfaces/parameter/IRectangleTransformParameterSettings";
import {
	CAMERA_TYPE,
	ICameraOptions,
	OrthographicCameraProperties,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
	PerspectiveCameraProperties,
} from "./interfaces/renderingEngine/cameraTypes";
import {
	ANTI_ALIASING_TECHNIQUE,
	IBloomEffectDefinition,
	IChromaticAberrationEffectDefinition,
	IDepthOfFieldEffectDefinition,
	IDotScreenEffectDefinition,
	IGodRaysEffectDefinition,
	IGridEffectDefinition,
	IHBAOEffectDefinition,
	IHueSaturationEffectDefinition,
	INoiseEffectDefinition,
	IOutlineEffectDefinition,
	IPixelationEffectDefinition,
	IPostProcessingEffectDefinition,
	IPostProcessingEffectsArray,
	IScanlineEffectDefinition,
	ISelectiveBloomEffectDefinition,
	ISepiaEffectDefinition,
	ISSAOEffectDefinition,
	ITiltShiftEffectDefinition,
	IVignetteEffectDefinition,
	POST_PROCESSING_EFFECT_TYPE,
} from "./interfaces/renderingEngine/IPostProcessingEffectDefinitions";
import {ITree} from "./interfaces/tree-node/ITree";
import {ITransformation, ITreeNode} from "./interfaces/tree-node/ITreeNode";
import {ITreeNodeData} from "./interfaces/tree-node/ITreeNodeData";

export {
	IMaterialStandardData,
	IMaterialStandardDataProperties,
	IMaterialStandardDataPropertiesDefinition,
	IMaterialAbstractData,
	IMaterialAbstractDataProperties,
	IMaterialAbstractDataPropertiesDefinition,
	IMaterialUnlitData,
	IMaterialUnlitDataProperties,
	IMaterialUnlitDataPropertiesDefinition,
	IMaterialShadowData,
	IMaterialShadowDataProperties,
	IMaterialShadowDataPropertiesDefinition,
	IMaterialSpecularGlossinessData,
	IMaterialSpecularGlossinessDataProperties,
	IMaterialSpecularGlossinessDataPropertiesDefinition,
	IMaterialGemData,
	IMaterialGemDataProperties,
	IMaterialGemDataPropertiesDefinition,
	IMaterialPointData,
	IMaterialPointDataProperties,
	IMaterialPointDataPropertiesDefinition,
	IMaterialMultiPointData,
	IMaterialMultiPointDataProperties,
	IMaterialMultiPointDataPropertiesDefinition,
	IMaterialBasicLineData,
	IMaterialBasicLineDataProperties,
	IMaterialBasicLineDataPropertiesDefinition,
	IMaterialLambertData,
	IMaterialLambertDataProperties,
	IMaterialLambertDataPropertiesDefinition,
	IMaterialPhongData,
	IMaterialPhongDataProperties,
	IMaterialPhongDataPropertiesDefinition,
	IMapData,
	IMapDataProperties,
	IMapDataPropertiesDefinition,
	MATERIAL_SIDE,
	MATERIAL_ALPHA,
	MATERIAL_SHADING,
	MATERIAL_TYPE,
	TEXTURE_WRAPPING,
	TEXTURE_FILTERING,
};
export {
	IAnimationData,
	IAnimationTrack,
	IGeometryData,
	IAttributeData,
	IPrimitiveData,
	IMaterialVariantsData,
	PRIMITIVE_MODE,
};
export {
	IAnchorDataImage,
	IAnchorDataText,
	IHTMLElementAnchorData,
	IHTMLElementAnchorUpdateProperties,
};
export {ICustomData, IInstanceData};
export {
	EventResponseMapping,
	IViewportEvent,
	ISessionEvent,
	ISessionErrorEvent,
	IOutputEvent,
	ICameraEvent,
	IRenderingEvent,
	IParameterEvent,
	ISceneEvent,
	ITaskEvent,
	ITaskEventDescription,
	TASK_TYPE,
	TASK_CATEGORY,
	TaskCategoryTypes,
	TASK_CATEGORY_SESSION_CUSTOMIZATION_CATEGORY,
};
export {
	ISDTFOverviewData,
	ISDTFOverview,
	ISDTFAttributesData,
	ISDTFAttributeData,
	ISDTFItemData,
	ISDTFAttributeVisualizationData,
	SdtfTypeHintName as SDTF_TYPEHINT,
	SdtfPrimitiveTypeGuard,
};
export {
	Color,
	SDImageBitmap,
	PARAMETER_TYPE,
	PARAMETER_VISUALIZATION,
	ISettingsSections,
	ISessionSettingsSections,
	IViewportSettingsSections,
};
export {
	InteractionParameterSettingsType,
	InteractionEffect,
	IInteractionParameterProps,
	IInteractionParameterSettings,
	IInteractionParameterJsonSchema,
	validateInteractionParameterSettings,
	ISelectionParameterProps,
	SelectionParameterValue,
	ISelectionParameterJsonSchema,
	ISelectionParameterPropsJsonSchema,
	validateSelectionParameterSettings,
	IGumballTransformParameterProps,
	GumballTransformParameterValue,
	IGumballTransformParameterJsonSchema,
	IGumballTransformParameterPropsJsonSchema,
	validateGumballTransformParameterSettings,
	IRectangleTransformParameterProps,
	RectangleTransformParameterValue,
	IRectangleTransformParameterJsonSchema,
	IRectangleTransformParameterPropsJsonSchema,
	validateRectangleTransformParameterSettings,
	IDraggingParameterProps,
	DraggingParameterValue,
	IDraggingParameterJsonSchema,
	IDraggingParameterPropsJsonSchema,
	validateDraggingParameterSettings,
	IDrawingParameterSettings,
	DrawingParameterValue,
	IDrawingParameterJsonSchema,
	validateDrawingParameterSettings,
	IDraggableObject,
	RestrictionDefinition,
	IVisualizationSettings,
	Rotation,
};
export {
	BUSY_MODE_DISPLAY,
	FLAG_TYPE,
	RENDERER_TYPE,
	SPINNER_POSITIONING,
	TEXTURE_ENCODING,
	TONE_MAPPING,
	VISIBILITY_MODE,
};
export {
	IRay,
	IIntersectionDefinition,
	IBoxSelectionIntersection,
	IRayTracingIntersection,
	IIntersectionFilter,
};
export {SessionCreationDefinition, ViewportCreationDefinition};
export {IChunkData};
export {
	ANTI_ALIASING_TECHNIQUE,
	IBloomEffectDefinition,
	IChromaticAberrationEffectDefinition,
	IDepthOfFieldEffectDefinition,
	IDotScreenEffectDefinition,
	IGodRaysEffectDefinition,
	IGridEffectDefinition,
	IHBAOEffectDefinition,
	IHueSaturationEffectDefinition,
	INoiseEffectDefinition,
	IOutlineEffectDefinition,
	IPixelationEffectDefinition,
	IPostProcessingEffectDefinition,
	IPostProcessingEffectsArray,
	IScanlineEffectDefinition,
	ISelectiveBloomEffectDefinition,
	ISepiaEffectDefinition,
	ISSAOEffectDefinition,
	ITiltShiftEffectDefinition,
	IVignetteEffectDefinition,
	POST_PROCESSING_EFFECT_TYPE,
};
export {
	CAMERA_TYPE,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
	ICameraOptions,
	OrthographicCameraProperties,
	PerspectiveCameraProperties,
};
export {
	ATTRIBUTE_VISUALIZATION,
	IGradient,
	INumberGradient,
	IStringGradient,
	Gradient,
};
export {ITree, ITreeNode, ITreeNodeData, ITransformation};
