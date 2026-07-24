import {SdtfPrimitiveTypeGuard} from "@shapediver/sdk.sdtf-primitives";
import {SdtfTypeHintName} from "@shapediver/sdk.sdtf-v1";

import {
	type IAnimationData,
	type IAnimationTrack} from "./interfaces/data/IAnimationData";
import {type IChunkData} from "./interfaces/data/IChunkData";
import {type ICustomData} from "./interfaces/data/ICustomData";
import {
	type IAttributeData,
	type IGeometryData,
	type IPrimitiveData,
	PRIMITIVE_MODE} from "./interfaces/data/IGeometryData";
import {
	type IAnchorDataImage,
	type IAnchorDataText,
	type IHTMLElementAnchorData,
	type IHTMLElementAnchorUpdateProperties} from "./interfaces/data/IHTMLElementAnchorData";
import {type IInstanceData} from "./interfaces/data/IInstanceData";
import {
	type IMapData,
	type IMapDataProperties,
	type IMapDataPropertiesDefinition,
	TEXTURE_FILTERING,
	TEXTURE_WRAPPING} from "./interfaces/data/material/IMapData";
import {
	type IMaterialAbstractData,
	type IMaterialAbstractDataProperties,
	type IMaterialAbstractDataPropertiesDefinition,
	MATERIAL_ALPHA,
	MATERIAL_SHADING,
	MATERIAL_SIDE,
	MATERIAL_TYPE} from "./interfaces/data/material/IMaterialAbstractData";
import {
	type IMaterialBasicLineData,
	type IMaterialBasicLineDataProperties,
	type IMaterialBasicLineDataPropertiesDefinition} from "./interfaces/data/material/IMaterialBasicLineData";
import {
	type IMaterialGemData,
	type IMaterialGemDataProperties,
	type IMaterialGemDataPropertiesDefinition} from "./interfaces/data/material/IMaterialGemDataProperties";
import {
	type IMaterialLambertData,
	type IMaterialLambertDataProperties,
	type IMaterialLambertDataPropertiesDefinition} from "./interfaces/data/material/IMaterialLambertData";
import {
	type IMaterialMultiPointData,
	type IMaterialMultiPointDataProperties,
	type IMaterialMultiPointDataPropertiesDefinition} from "./interfaces/data/material/IMaterialMultiPointData";
import {
	type IMaterialPhongData,
	type IMaterialPhongDataProperties,
	type IMaterialPhongDataPropertiesDefinition} from "./interfaces/data/material/IMaterialPhongData";
import {
	type IMaterialPointData,
	type IMaterialPointDataProperties,
	type IMaterialPointDataPropertiesDefinition} from "./interfaces/data/material/IMaterialPointData";
import {
	type IMaterialShadowData,
	type IMaterialShadowDataProperties,
	type IMaterialShadowDataPropertiesDefinition} from "./interfaces/data/material/IMaterialShadowData";
import {
	type IMaterialSpecularGlossinessData,
	type IMaterialSpecularGlossinessDataProperties,
	type IMaterialSpecularGlossinessDataPropertiesDefinition} from "./interfaces/data/material/IMaterialSpecularGlossinessDataProperties";
import {
	type IMaterialStandardData,
	type IMaterialStandardDataProperties,
	type IMaterialStandardDataPropertiesDefinition} from "./interfaces/data/material/IMaterialStandardData";
import {
	type IMaterialUnlitData,
	type IMaterialUnlitDataProperties,
	type IMaterialUnlitDataPropertiesDefinition} from "./interfaces/data/material/IMaterialUnlitData";
import {type IMaterialVariantsData} from "./interfaces/data/material/IMaterialVariantsData";
import {type EventResponseMapping} from "./interfaces/events/EventResponseMapping";
import {type ICameraEvent} from "./interfaces/events/ICameraEvent";
import {type IOutputEvent} from "./interfaces/events/IOutputEvent";
import {type IParameterEvent} from "./interfaces/events/IParameterEvent";
import {type IRenderingEvent} from "./interfaces/events/IRenderingEvent";
import {type ISceneEvent} from "./interfaces/events/ISceneEvent";
import {
	type ISessionErrorEvent,
	type ISessionEvent} from "./interfaces/events/ISessionEvent";
import {
	type ITaskEvent,
	type ITaskEventDescription,
	TASK_CATEGORY,
	TASK_CATEGORY_SESSION_CUSTOMIZATION_CATEGORY,
	TASK_TYPE,
	type TaskCategoryTypes} from "./interfaces/events/ITaskEvent";
import {type IViewportEvent} from "./interfaces/events/IViewportEvent";
import {
	type DraggingParameterValue,
	type IDraggableObject,
	type IDraggingParameterProps} from "./interfaces/parameter/IDraggingParameterSettings";
import {
	type DrawingParameterValue,
	IDrawingParameterJsonSchema,
	type IDrawingParameterSettings,
	type IVisualizationSettings,
	validateDrawingParameterSettings} from "./interfaces/parameter/IDrawingParametersSettings";
import {
	type GumballTransformParameterValue,
	type IGumballTransformParameterProps} from "./interfaces/parameter/IGumballTransformParameterSettings";
import {
	IDraggingParameterJsonSchema,
	IDraggingParameterPropsJsonSchema,
	IGumballTransformParameterJsonSchema,
	IGumballTransformParameterPropsJsonSchema,
	IInteractionParameterJsonSchema,
	type IInteractionParameterProps,
	type IInteractionParameterSettings,
	type InteractionEffect,
	type InteractionParameterSettingsType,
	IRectangleTransformParameterJsonSchema,
	IRectangleTransformParameterPropsJsonSchema,
	ISelectionParameterJsonSchema,
	ISelectionParameterPropsJsonSchema,
	validateDraggingParameterSettings,
	validateGumballTransformParameterSettings,
	validateInteractionParameterSettings,
	validateRectangleTransformParameterSettings,
	validateSelectionParameterSettings} from "./interfaces/parameter/IInteractionParameterSettings";
import {
	type RestrictionDefinition,
	type Rotation} from "./interfaces/parameter/IRestrictionSettings";
import {
	type ISelectionParameterProps,
	type SelectionParameterValue} from "./interfaces/parameter/ISelectionParameterSettings";
import {
	BUSY_MODE_DISPLAY,
	ENVIRONMENT_MAP_PBR_MODE,
	FLAG_TYPE,
	RENDERER_TYPE,
	SPINNER_POSITIONING,
	TEXTURE_ENCODING,
	TONE_MAPPING,
	VISIBILITY_MODE} from "./interfaces/renderingEngine/enums";
import {
	type IBoxSelectionIntersection,
	type IIntersectionDefinition,
	type IRayTracingIntersection} from "./interfaces/renderingEngine/IIntersection";
import {type IIntersectionFilter} from "./interfaces/renderingEngine/IIntersectionFilter";
import {type IRay} from "./interfaces/renderingEngine/IRay";
import {
	type ISDTFAttributeData,
	type ISDTFAttributesData} from "./interfaces/sdtf/ISDTFAttributesData";
import {type ISDTFAttributeVisualizationData} from "./interfaces/sdtf/ISDTFAttributeVisualizationData";
import {type ISDTFItemData} from "./interfaces/sdtf/ISDTFItemData";
import {
	type ISDTFOverview,
	type ISDTFOverviewData} from "./interfaces/sdtf/ISDTFOverviewData";
import {
	type Color,
	type ISessionSettingsSections,
	type ISettingsSections,
	type IViewportSettingsSections,
	PARAMETER_TYPE,
	PARAMETER_VISUALIZATION,
	type SDImageBitmap,
	SESSION_SETTINGS_MODE,
	type SessionCreationDefinition,
	type ViewportCreationDefinition} from "./types";

import {
	ATTRIBUTE_VISUALIZATION,
	type Gradient,
	type IGradient,
	type INumberGradient,
	type IStringGradient} from "./interfaces/attribute-visualization";
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
	type MainEventTypes} from "./interfaces/events/EventTypes";
import {type IEvent} from "./interfaces/events/IEvent";
import {type IBox} from "./interfaces/math/IBox";
import {type IGeometry} from "./interfaces/math/IGeometry";
import {type IPlane} from "./interfaces/math/IPlane";
import {type ISphere} from "./interfaces/math/ISphere";
import {type ISpherical} from "./interfaces/math/ISpherical";
import {type ITriangle} from "./interfaces/math/ITriangle";
import {
	type IRectangleTransformParameterProps,
	type RectangleTransformParameterValue} from "./interfaces/parameter/IRectangleTransformParameterSettings";
import {
	CAMERA_TYPE,
	type ICameraOptions,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
	type OrthographicCameraProperties,
	type PerspectiveCameraProperties} from "./interfaces/renderingEngine/cameraTypes";
import {
	ANTI_ALIASING_TECHNIQUE,
	type IBloomEffectDefinition,
	type IChromaticAberrationEffectDefinition,
	type IDepthOfFieldEffectDefinition,
	type IDotScreenEffectDefinition,
	type IGodRaysEffectDefinition,
	type IGridEffectDefinition,
	type IHBAOEffectDefinition,
	type IHueSaturationEffectDefinition,
	type INoiseEffectDefinition,
	type IOutlineEffectDefinition,
	type IPixelationEffectDefinition,
	type IPostProcessingEffectDefinition,
	type IPostProcessingEffectsArray,
	type IScanlineEffectDefinition,
	type ISelectiveBloomEffectDefinition,
	type ISepiaEffectDefinition,
	type ISSAOEffectDefinition,
	type ITiltShiftEffectDefinition,
	type IVignetteEffectDefinition,
	POST_PROCESSING_EFFECT_TYPE} from "./interfaces/renderingEngine/IPostProcessingEffectDefinitions";
import {type ITree} from "./interfaces/tree-node/ITree";
import {type ITransformation, type ITreeNode} from "./interfaces/tree-node/ITreeNode";
import {type ITreeNodeData} from "./interfaces/tree-node/ITreeNodeData";

export {ANTI_ALIASING_TECHNIQUE,
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
	ENVIRONMENT_MAP_PBR_MODE,
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
	VISIBILITY_MODE};
export type {Color,
	DraggingParameterValue,
	DrawingParameterValue,
	EventResponseMapping,
	Gradient,
	GumballTransformParameterValue,
	IAnchorDataImage,
	IAnchorDataText,
	IAnimationData,
	IAnimationTrack,
	IAttributeData,
	IBloomEffectDefinition,
	IBox,
	IBoxSelectionIntersection,
	ICameraEvent,
	ICameraOptions,
	IChromaticAberrationEffectDefinition,
	IChunkData,
	ICustomData,
	IDepthOfFieldEffectDefinition,
	IDotScreenEffectDefinition,
	IDraggableObject,
	IDraggingParameterProps,
	IDrawingParameterSettings,
	IEvent,
	IGeometry,
	IGeometryData,
	IGodRaysEffectDefinition,
	IGradient,
	IGridEffectDefinition,
	IGumballTransformParameterProps,
	IHBAOEffectDefinition,
	IHTMLElementAnchorData,
	IHTMLElementAnchorUpdateProperties,
	IHueSaturationEffectDefinition,
	IInstanceData,
	IInteractionParameterProps,
	IInteractionParameterSettings,
	IIntersectionDefinition,
	IIntersectionFilter,
	IMapData,
	IMapDataProperties,
	IMapDataPropertiesDefinition,
	IMaterialAbstractData,
	IMaterialAbstractDataProperties,
	IMaterialAbstractDataPropertiesDefinition,
	IMaterialBasicLineData,
	IMaterialBasicLineDataProperties,
	IMaterialBasicLineDataPropertiesDefinition,
	IMaterialGemData,
	IMaterialGemDataProperties,
	IMaterialGemDataPropertiesDefinition,
	IMaterialLambertData,
	IMaterialLambertDataProperties,
	IMaterialLambertDataPropertiesDefinition,
	IMaterialMultiPointData,
	IMaterialMultiPointDataProperties,
	IMaterialMultiPointDataPropertiesDefinition,
	IMaterialPhongData,
	IMaterialPhongDataProperties,
	IMaterialPhongDataPropertiesDefinition,
	IMaterialPointData,
	IMaterialPointDataProperties,
	IMaterialPointDataPropertiesDefinition,
	IMaterialShadowData,
	IMaterialShadowDataProperties,
	IMaterialShadowDataPropertiesDefinition,
	IMaterialSpecularGlossinessData,
	IMaterialSpecularGlossinessDataProperties,
	IMaterialSpecularGlossinessDataPropertiesDefinition,
	IMaterialStandardData,
	IMaterialStandardDataProperties,
	IMaterialStandardDataPropertiesDefinition,
	IMaterialUnlitData,
	IMaterialUnlitDataProperties,
	IMaterialUnlitDataPropertiesDefinition,
	IMaterialVariantsData,
	INoiseEffectDefinition,
	InteractionEffect,
	InteractionParameterSettingsType,
	INumberGradient,
	IOutlineEffectDefinition,
	IOutputEvent,
	IParameterEvent,
	IPixelationEffectDefinition,
	IPlane,
	IPostProcessingEffectDefinition,
	IPostProcessingEffectsArray,
	IPrimitiveData,
	IRay,
	IRayTracingIntersection,
	IRectangleTransformParameterProps,
	IRenderingEvent,
	IScanlineEffectDefinition,
	ISceneEvent,
	ISDTFAttributeData,
	ISDTFAttributesData,
	ISDTFAttributeVisualizationData,
	ISDTFItemData,
	ISDTFOverview,
	ISDTFOverviewData,
	ISelectionParameterProps,
	ISelectiveBloomEffectDefinition,
	ISepiaEffectDefinition,
	ISessionErrorEvent,
	ISessionEvent,
	ISessionSettingsSections,
	ISettingsSections,
	ISphere,
	ISpherical,
	ISSAOEffectDefinition,
	IStringGradient,
	ITaskEvent,
	ITaskEventDescription,
	ITiltShiftEffectDefinition,
	ITransformation,
	ITree,
	ITreeNode,
	ITreeNodeData,
	ITriangle,
	IViewportEvent,
	IViewportSettingsSections,
	IVignetteEffectDefinition,
	IVisualizationSettings,
	MainEventTypes,
	OrthographicCameraProperties,
	PerspectiveCameraProperties,
	RectangleTransformParameterValue,
	RestrictionDefinition,
	Rotation,
	SDImageBitmap,
	SelectionParameterValue,
	SessionCreationDefinition,
	TaskCategoryTypes,
	ViewportCreationDefinition};
