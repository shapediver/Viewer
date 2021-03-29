import { container, singleton } from 'tsyringe'
import { EventEngine, EVENTTYPE } from '../index';
import { StatePromise } from './StatePromise';

@singleton()
export class StateEngine {

    private readonly _eventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _settingsRegistered: StatePromise<boolean>;
    private readonly _boundingBoxCreated: StatePromise<boolean>;
    private readonly _firstSessionInitialized: StatePromise<boolean>;

    constructor() {
        this._settingsRegistered = new StatePromise();
        this._boundingBoxCreated = new StatePromise();
        this._firstSessionInitialized = new StatePromise();
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
}