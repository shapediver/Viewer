import { container, singleton } from 'tsyringe'

import { EventEngine, EVENTTYPE } from '../index'
import { StatePromise } from './StatePromise'

@singleton()
export class StateEngine {
    // #region Properties (10)

    private readonly _boundingBoxCreated: StatePromise<boolean>;
    private readonly _customStates:  {
        [key: string]: StatePromise<boolean>
    } = {};
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _firstViewerShown: StatePromise<boolean>;
    private readonly _fontLoaded: StatePromise<boolean>;
    private readonly _primarySessionLoaded: StatePromise<boolean>;
    private readonly _primarySettingsRegistered: StatePromise<boolean>;
    private readonly _sessions: {
        [key: string]: {
            initialized: StatePromise<boolean>,
            settingsRegistered: StatePromise<boolean>,
        }
    } = {};
    private readonly _viewers: {
        [key: string]: {
            initialized: StatePromise<boolean>,
            settingsLoaded: StatePromise<boolean>,
        }
    } = {};

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor() {
        this._primarySettingsRegistered = new StatePromise();
        this._boundingBoxCreated = new StatePromise();
        this._primarySessionLoaded = new StatePromise();
        this._firstViewerShown = new StatePromise();
        this._fontLoaded = new StatePromise();
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

    public get boundingBoxCreated(): StatePromise<boolean> {
        return this._boundingBoxCreated;
    }

    public get firstViewerShown(): StatePromise<boolean> {
        return this._firstViewerShown;
    }

    public get fontLoaded(): StatePromise<boolean> {
        return this._fontLoaded;
    }

    public get primarySessionLoaded(): StatePromise<boolean> {
        return this._primarySessionLoaded;
    }

    public get primarySettingsRegistered(): StatePromise<boolean> {
        return this._primarySettingsRegistered;
    }

    public get sessions(): {
        [key: string]: {
            initialized: StatePromise<boolean>,
            settingsRegistered: StatePromise<boolean>,
        }
    } {
        return this._sessions;
    }

    public get viewers(): {
        [key: string]: {
            initialized: StatePromise<boolean>,
            settingsLoaded: StatePromise<boolean>,
        }
    } {
        return this._viewers;
    }

    // #endregion Public Accessors (8)
}