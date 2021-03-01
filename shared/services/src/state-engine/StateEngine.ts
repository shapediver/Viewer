import { container, singleton } from 'tsyringe'
import { EventEngine, EVENTTYPE } from '../index';
import { StatePromise } from './StatePromise';

@singleton()
export class StateEngine {

    private readonly _eventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _settingsRegistered: StatePromise<boolean>;

    constructor() {
        this._settingsRegistered = new StatePromise();
        this._eventEngine.addListener(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, () => { 
            this._settingsRegistered.resolve(true);
        })
    }

    public get settingsRegistered(): StatePromise<boolean> {
        return this._settingsRegistered;
    }
}