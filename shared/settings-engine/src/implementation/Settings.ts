import { container, singleton } from 'tsyringe';

import { CameraSettings } from './sub/CameraSettings';

singleton();
export class Settings {
    // #region Properties (1)

    private _camera: CameraSettings = <CameraSettings>container.resolve(CameraSettings)

    // #endregion Properties (1)

    // #region Public Accessors (1)

    /**
     * Getter camera
     * @return {CameraSettings }
     */
    public get camera(): CameraSettings  {
		return this._camera;
	}

    // #endregion Public Accessors (1)
}

// viewer: {
//     blurSceneWhenBusy: new Setting(true, 'boolean', 'Blur or don\'t blur the scene while a process is busy'),
//     // container: new Setting(undefined, 'any', 'Container to use for creating the viewport, may be undefined in which case a DOM element whose id is domElementIdPrefix+\'-viewport\' will be looked for. An array of containers may be passed to create multiple viewports. Pass an empty array to avoid creating a viewport.'),
//     // deferGeometryLoading: new Setting(false, 'boolean', 'true: tell the CommPlugin instance created by the constructor to not load any geometry until first parameter update or refresh, false: load default geometry'),
//     ignoreSuperseded: new Setting(true, 'boolean', 'Ignore intermediate solutions which at the time of their arrival have already been superseded by another customization request', false),
//     loggingLevel: new Setting(-1, (value: number) => value >= -1 && value <=3, 'Level of log messages shown on the console, allowed values: -1 (none), 0 (error), 1 (warn), 2 (info), 3 (debug)', false),
//     // commPluginRuntimeId: new Setting('CommPlugin_1', 'string', 'runtime id to use for the CommPlugin instance created by the constructor'),
//     messageLoggingLevel: new Setting(-1, (value: number) => value >= -1 && value <=3, 'Log level to be used for logging internal messages, allowed values: -1 (none), 0 (error), 1 (warn), 2 (info), 3 (debug)', false),

//     // strictMode: new Setting(false, 'boolean', '', false),
//     showMessages: new Setting(true, 'boolean', 'Show or don\'t show user messages in the viewport', false),
//     hasRestoredSettings: new Setting(false, 'boolean', 'True if settings have been restored from a settings object delivered by a CommPlugin', false),
//     useModelSettings: new Setting(false, 'boolean', 'True if settings object delivered by first CommPlugin should be used', false),

//     // exposeViewer: new Setting(false, 'boolean'),
//     commitParameters: new Setting(false, 'boolean', 'Use or don\'t commit mode for parameters'),
//     commitSettings: new Setting(false, 'boolean', 'Use or don\'t commit mode for settings'),
//     viewerRuntimeId: new Setting('', 'string', 'The runtime id of this viewer', false),

//     scene: {
//         show: new Setting(false, 'boolean', 'Show / hide the scene', false),
//         // showSceneMode: new Setting(2, (value: number) => value >= 0 && value <= 3, 'when to fade in the scene: ON_SHOW(1), ON_FIRST_PLUGIN(2), ON_ALL_PLUGINS(3)'),
//         showSceneTransition: new Setting('1s', 'string', ''),

//         duration: new Setting(0, 'notnegative', 'Set fade in / fade out duration'),
//         fullscreen: new Setting(false, 'boolean', 'Enable / disable fullscreen mode', false),
//         gridVisibility: new Setting(true, 'boolean', 'Show / hide the grid'),
//         groundPlaneReflectionThreshold: new Setting(0.01, 'notnegative', 'Allows to control the distance to objects that are still reflected by the groundplane'),
//         groundPlaneReflectionVisibility: new Setting(false, 'boolean', 'Enable / disable the reflectivity of the groundplane'),
//         groundPlaneVisibility: new Setting(true, 'boolean', 'Show / hide the ground plane'),
//         lights: {
//             helper: new Setting(false, 'boolean', 'Show / hide the light helpers'),
//             lightScene: new Setting('default', 'string'),
//             lightScenes: new Setting({}, 'any'),
//         },
//         material: {
//             environmentMap: new Setting('none', (value: string | String | string[] | String[]) => true, 'Name of the environment map to use, or an array of 6 image URLs making up the cube mapped environment map (px, nx, pz, nz, py, ny)'),
//             environmentMapAsBackground: new Setting(false, 'boolean', 'Show / hide the environment map in the background'),
//             environmentMapResolution: new Setting('1024', (value: string) => (['256', '512', '1024', '2048'].includes(value)), 'Image resolution to be used for the named environment maps (available resolutions: 256, 512, 1024)'),
//         },
//         render: {
//             ambientOcclusion: new Setting(true, 'boolean', 'Enable / disable ambient occlusion for rendering'),
//             beautyRenderDelay: new Setting(50, 'notnegative', 'Amount of which the beauty rendering is delayed'),
//             beautyRenderBlendingDuration: new Setting(1500, 'notnegative', 'Time needed to blend the results of the beauty rendering'),
//             clearColor: new Setting('#ffffff', 'string', 'Set background color'),
//             clearAlpha: new Setting(1.0, 'factor', 'Set background alpha value'),
//             pointSize: new Setting(1.0, 'notnegative', 'Set size of point objects'),
//             shadows: new Setting(true, 'boolean', 'Enable / disable shadows for rendering'),
//             sao: {
//                 samples: new Setting(8, 'notnegative'),
//                 intensity: new Setting(0.1, 'notnegative'),
//                 kernelRadius: new Setting(8, 'notnegative'),
//                 standardDev: new Setting(25, 'notnegative'),
//             },
//         },
//     }
// },