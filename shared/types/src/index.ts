import {SdtfPrimitiveTypeGuard} from "@shapediver/sdk.sdtf-primitives";
import {SdtfTypeHintName} from "@shapediver/sdk.sdtf-v1";
import {AnimationData} from "./implementation/data/AnimationData";
import {BoneData} from "./implementation/data/BoneData";
import {ChunkData} from "./implementation/data/ChunkData";
import {CustomData} from "./implementation/data/CustomData";
import {
	AttributeData,
	GeometryData,
	PrimitiveData,
} from "./implementation/data/GeometryData";
import {
	HTMLElementAnchorCustomData,
	HTMLElementAnchorData,
	HTMLElementAnchorImageData,
	HTMLElementAnchorTextData,
} from "./implementation/data/HTMLElementAnchorData";
import {InstanceData} from "./implementation/data/InstanceData";
import {AbstractMaterialData} from "./implementation/material/AbstractMaterialData";
import {MapData} from "./implementation/material/MapData";
import {MaterialBasicLineData} from "./implementation/material/MaterialBasicLineData";
import {MaterialGemData} from "./implementation/material/MaterialGemData";
import {MaterialLambertData} from "./implementation/material/MaterialLambertData";
import {MaterialMultiPointData} from "./implementation/material/MaterialMultiPointData";
import {MaterialPhongData} from "./implementation/material/MaterialPhongData";
import {MaterialPointData} from "./implementation/material/MaterialPointData";
import {MaterialShadowData} from "./implementation/material/MaterialShadowData";
import {MaterialSpecularGlossinessData} from "./implementation/material/MaterialSpecularGlossinessData";
import {MaterialStandardData} from "./implementation/material/MaterialStandardData";
import {MaterialUnlitData} from "./implementation/material/MaterialUnlitData";
import {MaterialVariantsData} from "./implementation/material/MaterialVariantsData";
import {
	SDTFAttributeData,
	SDTFAttributesData,
} from "./implementation/sdtf/SDTFAttributesData";
import {SDTFItemData} from "./implementation/sdtf/SDTFItemData";
import {SDTFOverviewData} from "./implementation/sdtf/SDTFOverviewData";
import {
	IAnimationData,
	IAnimationTrack,
} from "./interfaces/data/IAnimationData";
import {IBoneData} from "./interfaces/data/IBoneData";
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
import {ISessionEvent} from "./interfaces/events/ISessionEvent";
import {ITaskEvent, TASK_TYPE} from "./interfaces/events/ITaskEvent";
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
	GumballParameterValue,
	IGumballParameterProps,
} from "./interfaces/parameter/IGumballParameterSettings";
import {
	IDraggingParameterJsonSchema,
	IDraggingParameterPropsJsonSchema,
	IGumballParameterJsonSchema,
	IGumballParameterPropsJsonSchema,
	IInteractionParameterJsonSchema,
	IInteractionParameterProps,
	IInteractionParameterSettings,
	InteractionEffect,
	InteractionParameterSettingsType,
	ISelectionParameterJsonSchema,
	ISelectionParameterPropsJsonSchema,
	validateDraggingParameterSettings,
	validateGumballParameterSettings,
	validateInteractionParameterSettings,
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
	SessionCreationDefinition,
	ViewportCreationDefinition,
} from "./types";

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

import {
	BlendFunction,
	BloomEffect,
	ChromaticAberrationEffect,
	DepthOfFieldEffect,
	DotScreenEffect,
	EdgeDetectionMode,
	Effect,
	EffectComposer,
	FXAAEffect,
	GodRaysEffect,
	GridEffect,
	HueSaturationEffect,
	KernelSize,
	NoiseEffect,
	OutlineEffect,
	PixelationEffect,
	PredicationMode,
	Resolution,
	ScanlineEffect,
	SelectiveBloomEffect,
	SepiaEffect,
	SMAAEffect,
	SMAAPreset,
	SSAOEffect,
	TiltShiftEffect,
	VignetteEffect,
	VignetteTechnique,
} from "postprocessing";
import {
	ATTRIBUTE_VISUALIZATION,
	Gradient,
	IGradient,
	INumberGradient,
	IStringGradient,
} from "./interfaces/attribute-visualization";
import {
	CAMERA_TYPE,
	ICameraOptions,
	OrthographicCameraProperties,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
	PerspectiveCameraProperties,
} from "./interfaces/renderingEngine/cameraTypes";

export {
	IMaterialStandardData,
	MaterialStandardData,
	IMaterialStandardDataProperties,
	IMaterialStandardDataPropertiesDefinition,
	IMaterialAbstractData,
	IMaterialAbstractDataProperties,
	AbstractMaterialData,
	IMaterialAbstractDataPropertiesDefinition,
	IMaterialUnlitData,
	MaterialUnlitData,
	IMaterialUnlitDataProperties,
	IMaterialUnlitDataPropertiesDefinition,
	IMaterialShadowData,
	MaterialShadowData,
	IMaterialShadowDataProperties,
	IMaterialShadowDataPropertiesDefinition,
	IMaterialSpecularGlossinessData,
	MaterialSpecularGlossinessData,
	IMaterialSpecularGlossinessDataProperties,
	IMaterialSpecularGlossinessDataPropertiesDefinition,
	IMaterialGemData,
	MaterialGemData,
	IMaterialGemDataProperties,
	IMaterialGemDataPropertiesDefinition,
	IMaterialPointData,
	MaterialPointData,
	IMaterialPointDataProperties,
	IMaterialPointDataPropertiesDefinition,
	IMaterialMultiPointData,
	MaterialMultiPointData,
	IMaterialMultiPointDataProperties,
	IMaterialMultiPointDataPropertiesDefinition,
	IMaterialBasicLineData,
	MaterialBasicLineData,
	IMaterialBasicLineDataProperties,
	IMaterialBasicLineDataPropertiesDefinition,
	IMaterialLambertData,
	MaterialLambertData,
	IMaterialLambertDataProperties,
	IMaterialLambertDataPropertiesDefinition,
	IMaterialPhongData,
	MaterialPhongData,
	IMaterialPhongDataProperties,
	IMaterialPhongDataPropertiesDefinition,
	IMapData,
	IMapDataProperties,
	IMapDataPropertiesDefinition,
	MapData,
	MATERIAL_SIDE,
	MATERIAL_ALPHA,
	MATERIAL_SHADING,
	MATERIAL_TYPE,
	TEXTURE_WRAPPING,
	TEXTURE_FILTERING,
};
export {
	IAnimationData,
	AnimationData,
	IAnimationTrack,
	IGeometryData,
	IAttributeData,
	IPrimitiveData,
	IMaterialVariantsData,
	GeometryData,
	AttributeData,
	PrimitiveData,
	MaterialVariantsData,
	PRIMITIVE_MODE,
};
export {
	IAnchorDataImage,
	IAnchorDataText,
	IHTMLElementAnchorData,
	IHTMLElementAnchorUpdateProperties,
	HTMLElementAnchorCustomData,
	HTMLElementAnchorTextData,
	HTMLElementAnchorImageData,
	HTMLElementAnchorData,
};
export {
	ICustomData,
	CustomData,
	IBoneData,
	BoneData,
	IInstanceData,
	InstanceData,
};
export {
	EventResponseMapping,
	IViewportEvent,
	ISessionEvent,
	IOutputEvent,
	ICameraEvent,
	IRenderingEvent,
	IParameterEvent,
	ISceneEvent,
	ITaskEvent,
	TASK_TYPE,
};
export {
	ISDTFOverviewData,
	SDTFOverviewData,
	ISDTFOverview,
	SDTFAttributesData,
	ISDTFAttributesData,
	ISDTFAttributeData,
	SDTFAttributeData,
	SDTFItemData,
	ISDTFItemData,
	ISDTFAttributeVisualizationData,
	SdtfTypeHintName as SDTF_TYPEHINT,
	SdtfPrimitiveTypeGuard,
};
export {
	Color,
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
	IGumballParameterProps,
	GumballParameterValue,
	IGumballParameterJsonSchema,
	IGumballParameterPropsJsonSchema,
	validateGumballParameterSettings,
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
export {IChunkData, ChunkData};
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
	BlendFunction,
	BloomEffect,
	ChromaticAberrationEffect,
	DepthOfFieldEffect,
	DotScreenEffect,
	EdgeDetectionMode,
	Effect,
	EffectComposer,
	FXAAEffect,
	GodRaysEffect,
	GridEffect,
	HueSaturationEffect,
	KernelSize,
	NoiseEffect,
	OutlineEffect,
	PixelationEffect,
	PredicationMode,
	Resolution,
	ScanlineEffect,
	SelectiveBloomEffect,
	SepiaEffect,
	SMAAEffect,
	SMAAPreset,
	SSAOEffect,
	TiltShiftEffect,
	VignetteEffect,
	VignetteTechnique,
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
