import { container, singleton } from 'tsyringe'
import { EventEngine, EVENTTYPE } from '../index';
import { StatePromise } from './StatePromise';

@singleton()
export class StateEngine {

    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _boundingBoxCreated: StatePromise<boolean>;
    private readonly _firstSessionLoaded: StatePromise<boolean>;
    private readonly _firstSettingsRegistered: StatePromise<boolean>;
    private readonly _firstViewerShown: StatePromise<boolean>;

    private readonly _customStates:  {
        [key: string]: StatePromise<boolean>
    } = {};


    constructor() {
        this._firstSettingsRegistered = new StatePromise();
        this._boundingBoxCreated = new StatePromise();
        this._firstSessionLoaded = new StatePromise();
        this._firstViewerShown = new StatePromise();
        this._eventEngine.addListener(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, (e) => { 
            this._firstSettingsRegistered.resolve(true);
            this.getCustomState((<any>e).sessionId + '_settings_registered').resolve(true);
        })
        this._eventEngine.addListener(EVENTTYPE.SESSION.SESSION_LOADED, () => { 
            this._firstSessionLoaded.resolve(true);
        })
    }

    public get firstSettingsRegistered(): StatePromise<boolean> {
        return this._firstSettingsRegistered;
    }

    public get boundingBoxCreated(): StatePromise<boolean> {
        return this._boundingBoxCreated;
    }

    public get firstSessionLoaded(): StatePromise<boolean> {
        return this._firstSessionLoaded;
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