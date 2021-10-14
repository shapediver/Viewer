import { container, singleton } from 'tsyringe'

import { EventEngine, EVENTTYPE } from '../index'
import { StatePromise } from './StatePromise'

@singleton()
export class StateEngine {

    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _boundingBoxCreated: StatePromise<boolean>;
    private readonly _primarySessionLoaded: StatePromise<boolean>;
    private readonly _primarySettingsRegistered: StatePromise<boolean>;
    private readonly _firstViewerShown: StatePromise<boolean>;
    private readonly _fontLoaded: StatePromise<boolean>;

    private readonly _customStates:  {
        [key: string]: StatePromise<boolean>
    } = {};


    constructor() {
        this._primarySettingsRegistered = new StatePromise();
        this._boundingBoxCreated = new StatePromise();
        this._primarySessionLoaded = new StatePromise();
        this._firstViewerShown = new StatePromise();
        this._fontLoaded = new StatePromise();
    }

    public get primarySettingsRegistered(): StatePromise<boolean> {
        return this._primarySettingsRegistered;
    }

    public get boundingBoxCreated(): StatePromise<boolean> {
        return this._boundingBoxCreated;
    }

    public get primarySessionLoaded(): StatePromise<boolean> {
        return this._primarySessionLoaded;
    }

    public get firstViewerShown(): StatePromise<boolean> {
        return this._firstViewerShown;
    }

    public get fontLoaded(): StatePromise<boolean> {
        return this._fontLoaded;
    }

    
    public getCustomState(id: string)  {
        return this._customStates[id];
    }

    public createCustomState(id: string): StatePromise<boolean> {
        this._customStates[id] = new StatePromise();
        return this._customStates[id];
    }
}