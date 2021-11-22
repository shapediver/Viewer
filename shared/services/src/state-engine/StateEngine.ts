import { container, singleton } from 'tsyringe'

import { EventEngine, EVENTTYPE } from '../index'
import { StatePromise } from './StatePromise'

@singleton()
export class StateEngine {
    // #region Properties (8)

    private readonly _boundingBoxCreated: StatePromise<boolean>;
    private readonly _customStates: {
        [key: string]: StatePromise<boolean>
    } = {};
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _fontLoaded: StatePromise<boolean>;
    private readonly _primarySessionAvailable: StatePromise<boolean>;
    private readonly _sessions: {
        [key: string]: {
            id: string,
            primary: boolean,
            initialized: StatePromise<boolean>,
            settingsRegistered: StatePromise<boolean>,
        }
    } = {};
    private readonly _viewers: {
        [key: string]: {
            id: string,
            initialized: StatePromise<boolean>,
            settingsLoaded: StatePromise<boolean>,
            environmentMapLoaded: StatePromise<boolean>
        }
    } = {};

    // #endregion Properties (8)

    // #region Constructors (1)

    constructor() {
        this._boundingBoxCreated = new StatePromise();
        this._fontLoaded = new StatePromise();
        this._primarySessionAvailable = new StatePromise();
    }

    // #endregion Constructors (1)

    // #region Public Accessors (7)

    public get boundingBoxCreated(): StatePromise<boolean> {
        return this._boundingBoxCreated;
    }

    public get fontLoaded(): StatePromise<boolean> {
        return this._fontLoaded;
    }

    public get primarySessionAvailable(): StatePromise<boolean> {
        return this._primarySessionAvailable;
    }

    public get primarySession(): {
        id: string,
        primary: boolean,
        initialized: StatePromise<boolean>,
        settingsRegistered: StatePromise<boolean>,
    } | null {
        for (let s in this.sessions)
            if (this.sessions[s].primary)
                return this.sessions[s];
        return null;
    }

    public get sessions(): {
        [key: string]: {
            id: string,
            primary: boolean,
            initialized: StatePromise<boolean>,
            settingsRegistered: StatePromise<boolean>,
        }
    } {
        return this._sessions;
    }

    public get viewers(): {
        [key: string]: {
            id: string,
            initialized: StatePromise<boolean>,
            settingsLoaded: StatePromise<boolean>,
            environmentMapLoaded: StatePromise<boolean>
        }
    } {
        return this._viewers;
    }

    // #endregion Public Accessors (7)
}