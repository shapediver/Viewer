import { SessionEngine } from '@shapediver/viewer.session-engine.session-engine';
import { ISessionGlobalAccessObjectDefinition, SettingsEngine, StatePromise } from '@shapediver/viewer.shared.services';
import { ShapeDiverRequestGltfUploadQueryConversion, ShapeDiverResponseDto } from '@shapediver/sdk.geometry-api-sdk-v2';

export class SessionGlobalAccessObject implements ISessionGlobalAccessObjectDefinition {
    // #region Properties (5)

    readonly #sessionEngine: SessionEngine;

    #initialOutputsLoaded: StatePromise<boolean> = new StatePromise();
    #initialized: StatePromise<boolean> = new StatePromise();
    #isFirstSession: boolean = false;
    #settingsRegistered: StatePromise<boolean> = new StatePromise();

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(sessionEngine: SessionEngine) {
        this.#sessionEngine = sessionEngine;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (9)

    public get canUploadGLTF(): boolean {
        return this.#sessionEngine.canUploadGLTF;
    }

    public get id(): string {
        return this.#sessionEngine.id;
    }

    public get initialOutputsLoaded(): StatePromise<boolean> {
        return this.#initialOutputsLoaded;
    }

    public get initialized(): StatePromise<boolean> {
        return this.#initialized;
    }

    public get isFirstSession(): boolean {
        return this.#isFirstSession;
    }

    public set isFirstSession(value: boolean) {
        this.#isFirstSession = value;
    }

    public get modelViewUrl(): string {
        return this.#sessionEngine.modelViewUrl;
    }

    public get settingsEngine(): SettingsEngine {
        return this.#sessionEngine.settingsEngine;
    }

    public get settingsRegistered(): StatePromise<boolean> {
        return this.#settingsRegistered;
    }

    // #endregion Public Getters And Setters (9)

    // #region Public Methods (1)

    public uploadGLTF(gltf: Blob, name: ShapeDiverRequestGltfUploadQueryConversion | undefined): Promise<ShapeDiverResponseDto> {
        return this.#sessionEngine.uploadGLTF(gltf, name);
    }

    // #endregion Public Methods (1)
}