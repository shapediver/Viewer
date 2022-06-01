import { container, singleton } from 'tsyringe'

import { EventEngine } from '../index'
import { StatePromise } from './StatePromise'

@singleton()
export class StateEngine {
    // #region Properties (8)

    private readonly _customStates: {
        [key: string]: StatePromise<boolean>
    } = {};
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _fontLoaded: StatePromise<boolean>;
    private readonly _sessionEngines: {
        [key: string]: {
            id: string,
            initialized: StatePromise<boolean>,
            settingsRegistered: StatePromise<boolean>,
        }
    } = {};
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

    // #endregion Properties (8)

    // #region Constructors (1)

    constructor() {
        this._fontLoaded = new StatePromise();
    }

    // #endregion Constructors (1)

    // #region Public Accessors (7)

    public get fontLoaded(): StatePromise<boolean> {
        return this._fontLoaded;
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

    // #endregion Public Accessors (7)
}