import { container, singleton } from 'tsyringe'
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.event-engine';

@singleton()
export class StateEngine {

    private readonly _eventEngine = <EventEngine>container.resolve(EventEngine);
    private _settingsRegistered: boolean = false;

    constructor() {
        console.log('registering')
        this._eventEngine.addListener(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, () => { 
            this._settingsRegistered = true;
            console.log('event')
        })
    }

    public get settingsRegistered(): boolean {
        return this._settingsRegistered;
    }
}