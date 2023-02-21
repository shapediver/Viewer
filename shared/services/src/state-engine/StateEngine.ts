import { StatePromise } from './StatePromise'

export class StateEngine {
    // #region Properties (6)

    private readonly _fontLoaded: StatePromise<boolean> = new StatePromise();
    private readonly _renderingEngines: {
        [key: string]: {
            id: string,
            initialized: StatePromise<boolean>,
            settingsAssigned: StatePromise<boolean>,
            environmentMapLoaded: StatePromise<boolean>,
            boundingBoxCreated: StatePromise<boolean>,
            busy: string[]
        }
    } = {};
    private readonly _sessionEngines: {
        [key: string]: {
            id: string,
            initialized: StatePromise<boolean>,
            settingsRegistered: StatePromise<boolean>,
        }
    } = {};

    private static _instance: StateEngine;

    // #endregion Properties (6)

    // #region Constructors (1)

    private constructor() {
        this._fontLoaded = new StatePromise();
    }

    // #endregion Constructors (1)

    // #region Public Static Accessors (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Accessors (1)

    // #region Public Accessors (3)

    public get fontLoaded(): StatePromise<boolean> {
        return this._fontLoaded;
    }

    public get renderingEngines(): {
        [key: string]: {
            id: string,
            initialized: StatePromise<boolean>,
            settingsAssigned: StatePromise<boolean>,
            environmentMapLoaded: StatePromise<boolean>,
            boundingBoxCreated: StatePromise<boolean>,
            busy: string[]
        }
    } {
        return this._renderingEngines;
    }

    public get sessionEngines(): {
        [key: string]: {
            id: string,
            initialized: StatePromise<boolean>,
            settingsRegistered: StatePromise<boolean>,
        }
    } {
        return this._sessionEngines;
    }

    // #endregion Public Accessors (3)
}