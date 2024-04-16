## Viewport Settings

### enableAR
> Option to enable / disable the AR (Augmented Reality) functionality for this viewport. (default: true)
>
> This setting is used purely for UI purposes, it does not have any influence on the viewport itself.

### arScale
> The scaling factor that is used when exporting the scene for AR (Augmented Reality).
>
> The unit system used by AR is meter, therefore this scaling factor needs to be chosen
> such that scene coordinates are transformed to meters.

### arTranslation
> The translation factor that is used when exporting the scene for AR (Augmented Reality). The unit system used by AR is meter.

### arRotation
> The rotation factor that is used when exporting the scene for AR (Augmented Reality). The unit system used by AR is meter.

### ambientOcclusion
> Option to enable / disable the ambient occlusion post-processing. (default: false)

### ambientOcclusionIntensity
> The ambient occlusion intensity.

### automaticResizing
> Option to enable / disable the automatic resizing of the viewport to changes of the {@link canvas}. (default: true)

### beautyRenderBlendingDuration
> The duration used by the beauty rendering to blend in (milliseconds).

### beautyRenderDelay
> The delay after which the beauty rendering starts (milliseconds).

### busyModeDisplay
> The mode used to indicate that the viewport is busy. (default: BUSY_MODE_DISPLAY.SPINNER)
>
> Whenever the busy mode gets toggled, the events {@link EVENTTYPE_VIEWPORT.BUSY_MODE_ON} and {@link EVENTTYPE_VIEWPORT.BUSY_MODE_OFF} will be emitted.

### clearAlpha
> The clear alpha value of the viewport.
>
> Use this to influence the background appearance of the viewport.

### clearColor
> The clear color value of the viewport.
>
> Use this to influence the background appearance of the viewport.

### environmentMap
> The environment map used by the viewport.
>
> You can either use the HDR maps at {@link ENVIRONMENT_MAP} or the LDR legacy maps at {@link ENVIRONMENT_MAP_CUBE}.
>
> Additionally, you can specify your own maps. For HDR maps, provide a link to a .hdr file, for LDR provide the folder where the six cube map images are located.

### environmentMapAsBackground
> Option to set the environment map as the background of the viewport. (default: false)

### environmentMapResolution
> The environment map resolution that is used for preset cube maps.

### gridColor
> The color of the grid.

### gridVisibility
> Option to enable / disable the grid. (default: true)

### groundPlaneColor
> The color of the ground plane.

### groundPlaneVisibility
> Option to enable / disable the ground plane. (default: true)

### groundPlaneShadowColor
> The color of the ground plane shadow.

### groundPlaneShadowVisibility
> Option to enable / disable the ground plane shadow. (default: false)

### outputEncoding
> The encoding that is used for the output texture. (default: TEXTURE_ENCODING.SRGB)
> 
> This is the texture that is rendered to the screen.

### physicallyCorrectLights
> Option to enable / disable the physically correct lights. (default: true)

### pointSize
> The point size that is used for rendering point data.

### sessionSettingsId
> Optional identifier of the session to be used for loading / persisting settings of the viewport.
> 
> This is ignored in case {@link sessionSettingsMode} is not {@link SESSION_SETTINGS_MODE.MANUAL}.

### sessionSettingsMode
> Allows to control which session to use for loading / persisting settings of the viewport (default: {@link SESSION_SETTINGS_MODE.FIRST}).

### shadows
> Option to enable / disable rendering of shadows. (default: true)

### show
> Option to show / hide the viewport.
> 
> This will disable rendering, and hide the canvas behind the logo.
> Using this setting especially makes sense with {@link VISIBILITY_MODE.MANUAL} where you can decide at what point you first want to show the scene.

### showStatistics
> Option to show / hide rendering statistics overlayed to the viewport. (default: false)

### textureEncoding
> The encoding that is used for textures. (default: TEXTURE_ENCODING.SRGB)
  
### toneMapping
> The tone mapping that is used. (default: TONE_MAPPING.NONE)

### toneMappingExposure
> The intensity of the tone mapping.

### type
> The type of rendering of this viewport.

### visualizeAttributes
> A possibility to visualize the attributes of the scene in any way you want. 
>
> Please have a look at the {@link https://help.shapediver.com/doc/Attribute-Visualization.1856733198.html|help desk} documentation for more information.
>
> Provide a callback that transforms a {@link ISDTFItemData} to a {@link ISDTFAttributeVisualizationData}.
>
> The {@link ISDTFOverview} provides general information like min and max values for numbers or the available options for strings.