import { container, singleton } from 'tsyringe'

import { EVENTTYPE, MainEventTypes } from './EventTypes'
import { IListener } from './interfaces/IListener'
import { ICallback } from './interfaces/ICallback'
import { IEvent } from './interfaces/IEvent'
import { UuidGenerator } from '../uuid-generator/UuidGenerator'
import { Logger, LOGGING_TOPIC } from '../logger/Logger'

@singleton()
export class EventEngine {
    // #region Properties (2)

    protected readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    protected readonly _logger: Logger = <Logger>container.resolve(Logger);
    private _eventListeners: {
        [key: string]: IListener[]
    };

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor() {
        this._eventListeners = {};
        for (const type in EVENTTYPE) {
            const subEventType = EVENTTYPE[type as keyof typeof EVENTTYPE];
            this._eventListeners[type.toLowerCase()] = [];
            for (const subtype in subEventType) {
                this._eventListeners[subEventType[subtype as keyof typeof subEventType]] = [];
            }
        }
    }

    // #endregion Constructors (1)

    private convertTypeToString(type: string | MainEventTypes): string {
        let typeString: string = '';
        if(typeof type === 'string') typeString = type;

        for (const mainType in EVENTTYPE)
            if(type === EVENTTYPE[mainType as keyof typeof EVENTTYPE])
                typeString = mainType.toLowerCase();
        
        if(!typeString || !this._eventListeners[typeString]) {
            this._logger.warn(LOGGING_TOPIC.GENERAL, 'EventEngine.convertTypeToString: No valid type provided.');
            return '';
        }
        
        return typeString;
    }

    // #region Public Methods (3)

    /**
     * Adds a listener that listenes to the provided type. If no valid type is specified, an error is thrown.
     * 
     * @param type the type of the event
     * @param cb the callback that should be called
     * @returns an unique token to be able to remove the listener
     */
    public addListener(type: string | MainEventTypes, cb: ICallback): string {
        const typeString: string = this.convertTypeToString(type);
        if(!typeString) return '';
        const token = this._uuidGenerator.create();
        this._eventListeners[typeString]?.push({ token, cb });
        return token;
    }

    /**
     * Emits the event to all callbacks that listen to the type.
     * 
     * @param type the type of the event
     * @param event the event to emit
     */
    public emitEvent(type: string | MainEventTypes, event: IEvent): void {
        const typeString: string = this.convertTypeToString(type);

        if (this._eventListeners[typeString] && this._eventListeners[typeString].length !== 0) 
            for (let i = 0; i < this._eventListeners[typeString]!.length; i++)
                this._eventListeners[typeString]![i].cb(event);

        if(typeString.includes('.')) 
            this.emitEvent(typeString.substr(0, typeString.indexOf('.')), event);
    }

    /**
     * Removes a listener with the specified token.
     * 
     * @param token the token of the listener 
     * @returns result of the targeted operation
     */
    public removeListener(token: string): boolean {
        for (const type in EVENTTYPE) {
            const subEventType = EVENTTYPE[type as keyof typeof EVENTTYPE];
            const typeLowerCase = type.toLowerCase();
            for (let i = 0; i < this._eventListeners[typeLowerCase]!.length; i++) {
                if (this._eventListeners[typeLowerCase]![i].token === token) {
                    this._eventListeners[typeLowerCase]!.splice(i, 1);
                    return true;
                }
            }
            for (const subtype in subEventType) {
                for (let i = 0; i < this._eventListeners[subEventType[subtype as keyof typeof subEventType]]!.length; i++) {
                    if (this._eventListeners[subEventType[subtype as keyof typeof subEventType]]![i].token === token) {
                        this._eventListeners[subEventType[subtype as keyof typeof subEventType]]!.splice(i, 1);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // #endregion Public Methods (3)
}