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
	TASK_CATEGORY,
	TASK_CATEGORY_SESSION_CUSTOMIZATION_CATEGORY,
	TASK_TYPE,
	TaskCategoryTypes,
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
	SESSION_SETTINGS_MODE,
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
	EVENTTYPE,
	EVENTTYPE_CAMERA,
	EVENTTYPE_DRAWING_TOOLS,
	EVENTTYPE_INTERACTION,
	EVENTTYPE_OUTPUT,
	EVENTTYPE_PARAMETER,
	EVENTTYPE_RENDERING,
	EVENTTYPE_SCENE,
	EVENTTYPE_SESSION,
	EVENTTYPE_TASK,
	EVENTTYPE_TRANSFORMATION_TOOLS,
	EVENTTYPE_VIEWPORT,
	MainEventTypes,
} from "./interfaces/events/EventTypes";
import {IEvent} from "./interfaces/events/IEvent";
import {IBox} from "./interfaces/math/IBox";
import {IGeometry} from "./interfaces/math/IGeometry";
import {IPlane} from "./interfaces/math/IPlane";
import {ISphere} from "./interfaces/math/ISphere";
import {ISpherical} from "./interfaces/math/ISpherical";
import {ITriangle} from "./interfaces/math/ITriangle";
import {
	IRectangleTransformParameterProps,
	RectangleTransformParameterValue,
} from "./interfaces/parameter/IRectangleTransformParameterSettings";
import {
	CAMERA_TYPE,
	ICameraOptions,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
	OrthographicCameraProperties,
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
	ANTI_ALIASING_TECHNIQUE,
	ATTRIBUTE_VISUALIZATION,
	BUSY_MODE_DISPLAY,
	CAMERA_TYPE,
	EVENTTYPE,
	EVENTTYPE_CAMERA,
	EVENTTYPE_DRAWING_TOOLS,
	EVENTTYPE_INTERACTION,
	EVENTTYPE_OUTPUT,
	EVENTTYPE_PARAMETER,
	EVENTTYPE_RENDERING,
	EVENTTYPE_SCENE,
	EVENTTYPE_SESSION,
	EVENTTYPE_TASK,
	EVENTTYPE_TRANSFORMATION_TOOLS,
	EVENTTYPE_VIEWPORT,
	FLAG_TYPE,
	IDraggingParameterJsonSchema,
	IDraggingParameterPropsJsonSchema,
	IDrawingParameterJsonSchema,
	IGumballTransformParameterJsonSchema,
	IGumballTransformParameterPropsJsonSchema,
	IInteractionParameterJsonSchema,
	IRectangleTransformParameterJsonSchema,
	IRectangleTransformParameterPropsJsonSchema,
	ISelectionParameterJsonSchema,
	ISelectionParameterPropsJsonSchema,
	MATERIAL_ALPHA,
	MATERIAL_SHADING,
	MATERIAL_SIDE,
	MATERIAL_TYPE,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
	PARAMETER_TYPE,
	PARAMETER_VISUALIZATION,
	POST_PROCESSING_EFFECT_TYPE,
	PRIMITIVE_MODE,
	RENDERER_TYPE,
	SdtfTypeHintName as SDTF_TYPEHINT,
	SdtfPrimitiveTypeGuard,
	SESSION_SETTINGS_MODE,
	SPINNER_POSITIONING,
	TASK_CATEGORY,
	TASK_CATEGORY_SESSION_CUSTOMIZATION_CATEGORY,
	TASK_TYPE,
	TEXTURE_ENCODING,
	TEXTURE_FILTERING,
	TEXTURE_WRAPPING,
	TONE_MAPPING,
	validateDraggingParameterSettings,
	validateDrawingParameterSettings,
	validateGumballTransformParameterSettings,
	validateInteractionParameterSettings,
	validateRectangleTransformParameterSettings,
	validateSelectionParameterSettings,
	VISIBILITY_MODE,
	type Color,
	type DraggingParameterValue,
	type DrawingParameterValue,
	type EventResponseMapping,
	type Gradient,
	type GumballTransformParameterValue,
	type IAnchorDataImage,
	type IAnchorDataText,
	type IAnimationData,
	type IAnimationTrack,
	type IAttributeData,
	type IBloomEffectDefinition,
	type IBox,
	type IBoxSelectionIntersection,
	type ICameraEvent,
	type ICameraOptions,
	type IChromaticAberrationEffectDefinition,
	type IChunkData,
	type ICustomData,
	type IDepthOfFieldEffectDefinition,
	type IDotScreenEffectDefinition,
	type IDraggableObject,
	type IDraggingParameterProps,
	type IDrawingParameterSettings,
	type IEvent,
	type IGeometry,
	type IGeometryData,
	type IGodRaysEffectDefinition,
	type IGradient,
	type IGridEffectDefinition,
	type IGumballTransformParameterProps,
	type IHBAOEffectDefinition,
	type IHTMLElementAnchorData,
	type IHTMLElementAnchorUpdateProperties,
	type IHueSaturationEffectDefinition,
	type IInstanceData,
	type IInteractionParameterProps,
	type IInteractionParameterSettings,
	type IIntersectionDefinition,
	type IIntersectionFilter,
	type IMapData,
	type IMapDataProperties,
	type IMapDataPropertiesDefinition,
	type IMaterialAbstractData,
	type IMaterialAbstractDataProperties,
	type IMaterialAbstractDataPropertiesDefinition,
	type IMaterialBasicLineData,
	type IMaterialBasicLineDataProperties,
	type IMaterialBasicLineDataPropertiesDefinition,
	type IMaterialGemData,
	type IMaterialGemDataProperties,
	type IMaterialGemDataPropertiesDefinition,
	type IMaterialLambertData,
	type IMaterialLambertDataProperties,
	type IMaterialLambertDataPropertiesDefinition,
	type IMaterialMultiPointData,
	type IMaterialMultiPointDataProperties,
	type IMaterialMultiPointDataPropertiesDefinition,
	type IMaterialPhongData,
	type IMaterialPhongDataProperties,
	type IMaterialPhongDataPropertiesDefinition,
	type IMaterialPointData,
	type IMaterialPointDataProperties,
	type IMaterialPointDataPropertiesDefinition,
	type IMaterialShadowData,
	type IMaterialShadowDataProperties,
	type IMaterialShadowDataPropertiesDefinition,
	type IMaterialSpecularGlossinessData,
	type IMaterialSpecularGlossinessDataProperties,
	type IMaterialSpecularGlossinessDataPropertiesDefinition,
	type IMaterialStandardData,
	type IMaterialStandardDataProperties,
	type IMaterialStandardDataPropertiesDefinition,
	type IMaterialUnlitData,
	type IMaterialUnlitDataProperties,
	type IMaterialUnlitDataPropertiesDefinition,
	type IMaterialVariantsData,
	type INoiseEffectDefinition,
	type InteractionEffect,
	type InteractionParameterSettingsType,
	type INumberGradient,
	type IOutlineEffectDefinition,
	type IOutputEvent,
	type IParameterEvent,
	type IPixelationEffectDefinition,
	type IPlane,
	type IPostProcessingEffectDefinition,
	type IPostProcessingEffectsArray,
	type IPrimitiveData,
	type IRay,
	type IRayTracingIntersection,
	type IRectangleTransformParameterProps,
	type IRenderingEvent,
	type IScanlineEffectDefinition,
	type ISceneEvent,
	type ISDTFAttributeData,
	type ISDTFAttributesData,
	type ISDTFAttributeVisualizationData,
	type ISDTFItemData,
	type ISDTFOverview,
	type ISDTFOverviewData,
	type ISelectionParameterProps,
	type ISelectiveBloomEffectDefinition,
	type ISepiaEffectDefinition,
	type ISessionErrorEvent,
	type ISessionEvent,
	type ISessionSettingsSections,
	type ISettingsSections,
	type ISphere,
	type ISpherical,
	type ISSAOEffectDefinition,
	type IStringGradient,
	type ITaskEvent,
	type ITaskEventDescription,
	type ITiltShiftEffectDefinition,
	type ITransformation,
	type ITree,
	type ITreeNode,
	type ITreeNodeData,
	type ITriangle,
	type IViewportEvent,
	type IViewportSettingsSections,
	type IVignetteEffectDefinition,
	type IVisualizationSettings,
	type MainEventTypes,
	type OrthographicCameraProperties,
	type PerspectiveCameraProperties,
	type RectangleTransformParameterValue,
	type RestrictionDefinition,
	type Rotation,
	type SDImageBitmap,
	type SelectionParameterValue,
	type SessionCreationDefinition,
	type TaskCategoryTypes,
	type ViewportCreationDefinition,
};
