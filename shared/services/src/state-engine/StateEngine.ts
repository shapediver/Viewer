import { ShapeDiverRequestGltfUploadQueryConversion, ShapeDiverResponseDto } from '@shapediver/sdk.geometry-api-sdk-v2';
import { SESSION_SETTINGS_MODE, SettingsEngine } from '../settings-engine/SettingsEngine';
import { StatePromise } from './StatePromise';

// #region Interfaces (2)

interface ISessionStateDefinition {
    // #region Properties (4)

    canUploadGLTF: boolean,
    id: string,
    initialOutputsLoaded: StatePromise<boolean>,
    initialized: StatePromise<boolean>,
    isFirstSession: boolean,
    modelViewUrl: string,
    settingsRegistered: StatePromise<boolean>,
    settingsEngine: SettingsEngine,
    uploadGLTF: (gltf: Blob, name: ShapeDiverRequestGltfUploadQueryConversion | undefined) => Promise<ShapeDiverResponseDto>,

    // #endregion Properties (4)
}

interface IViewportStateDefinition {
    // #region Properties (13)

    applySettings: (
        sections?:
            {
                ar?: boolean,
                scene?: boolean,
                camera?: boolean,
                light?: boolean,
                environment?: boolean,
                general?: boolean,
                postprocessing?: boolean
            },
        settingsEngine?: SettingsEngine,
        updateViewport?: boolean
    ) => Promise<void>,
    assignSettingsEngine: (settingsEngine: SettingsEngine) => void,
    boundingBoxCreated: StatePromise<boolean>,
    busy: string[],
    displayErrorMessage: (message: string) => void,
    environmentMapLoaded: StatePromise<boolean>,
    id: string,
    initialized: StatePromise<boolean>,
    reset: () => void,
    saveSettings: (settingsEngine?: SettingsEngine) => void,
    sessionSettingsId?: string,
    sessionSettingsMode: SESSION_SETTINGS_MODE,
    settingsAssigned: StatePromise<boolean>,
    update: (id: string) => void,

    // #endregion Properties (13)
}

// #endregion Interfaces (2)

// #region Classes (1)

export class StateEngine {
    // #region Properties (4)

    private readonly _fontLoaded: StatePromise<boolean> = new StatePromise();
    private readonly _sessionEngines: { [key: string]: ISessionStateDefinition } = {};
    private readonly _viewportEngines: { [key: string]: IViewportStateDefinition } = {};

    private static _instance: StateEngine;

    // #endregion Properties (4)

    // #region Constructors (1)

    private constructor() {
        this._fontLoaded = new StatePromise();
    }

    // #endregion Constructors (1)

    // #region Public Static Getters And Setters (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Getters And Setters (1)

    // #region Public Getters And Setters (3)

    public get fontLoaded(): StatePromise<boolean> {
        return this._fontLoaded;
    }

    public get sessionEngines(): { [key: string]: ISessionStateDefinition } {
        return this._sessionEngines;
    }

    public get viewportEngines(): { [key: string]: IViewportStateDefinition } {
        return this._viewportEngines;
    }

    // #endregion Public Getters And Setters (3)
}

// #endregion Classes (1)
