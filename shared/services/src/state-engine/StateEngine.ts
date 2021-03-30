import { container, singleton } from 'tsyringe'
import { EventEngine, EVENTTYPE } from '../index';
import { StatePromise } from './StatePromise';

@singleton()
export class StateEngine {

    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _settingsRegistered: StatePromise<boolean>;
    private readonly _boundingBoxCreated: StatePromise<boolean>;
    private readonly _firstSessionInitialized: StatePromise<boolean>;
    private readonly _firstViewerShown: StatePromise<boolean>;

    private readonly _customStates:  {
        [key: string]: StatePromise<boolean>
    } = {};


    constructor() {
        this._settingsRegistered = new StatePromise();
        this._boundingBoxCreated = new StatePromise();
        this._firstSessionInitialized = new StatePromise();
        this._firstViewerShown = new StatePromise();
        this._eventEngine.addListener(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, () => { 
            this._settingsRegistered.resolve(true);
        })
        this._eventEngine.addListener(EVENTTYPE.SESSION.SESSION_INITIALIZED, () => { 
            this._firstSessionInitialized.resolve(true);
        })
    }

    public get settingsRegistered(): StatePromise<boolean> {
        return this._settingsRegistered;
    }

    public get boundingBoxCreated(): StatePromise<boolean> {
        return this._boundingBoxCreated;
    }

    public get firstSessionInitialized(): StatePromise<boolean> {
        return this._firstSessionInitialized;
    }

    public get firstViewerShown(): StatePromise<boolean> {
        return this._firstViewerShown;
    }

    
    public getCustomState(id: string)  {
        return this._customStates[id];
    }

    public createCustomState(id: string): StatePromise<boolean> {
        this._customStates[id] = new StatePromise();
        return this._customStates[id];
    }
}