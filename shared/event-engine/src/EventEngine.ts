import { container, singleton } from "tsyringe";
import { EVENTTYPE } from "./EventTypes";
import { IListener } from "./interfaces/IListener";
import { ICallback } from "./interfaces/ICallback";
import { IEvent } from "./interfaces/IEvent";

import uuid from '@shapediver/viewer.utils.uuid'

@singleton()
export class EventEngine {
    // #region Properties (2)

    private _eventListeners: {
        [key: string]: IListener[]
    };

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor() {
        this._eventListeners = {};
        for (const type in EVENTTYPE) {
            this._eventListeners[EVENTTYPE[type as keyof typeof EVENTTYPE]] = [];
        }
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    /**
     * Adds a listener that listenes to the provided type. If no valid type is specified, an error is thrown.
     * 
     * @param type the type of the event
     * @param cb the callback that should be called
     * @returns an unique token to be able to remove the listener
     */
    public addListener(type: EVENTTYPE, cb: ICallback): string {
        if (!Object.values(EVENTTYPE).includes(type)) throw new Error('No valid type provided.');
        const token = uuid.create();
        this._eventListeners[type]?.push({ token, cb });
        return token;
    }

    /**
     * Emits the event to all callbacks that listen to the type.
     * 
     * @param type the type of the event
     * @param event the event to emit
     */
    public emitEvent(type: EVENTTYPE, event: IEvent): void {
        if (Object.values(EVENTTYPE).includes(type) && this._eventListeners[type]?.length !== 0) {
            for (let i = 0; i < this._eventListeners[type]!.length; i++){
                this._eventListeners[type]![i].cb(event);
            }
        }

        if(type.includes('.')) {
            this.emitEvent(<EVENTTYPE>type.substr(0, type.indexOf('.')), event);
        }
    }

    /**
     * Removes a listener with the specified token.
     * 
     * @param token the token of the listener 
     * @returns result of the targeted operation
     */
    public removeListener(token: string): boolean {
        for (const type in EVENTTYPE) {
            for (let i = 0; i < this._eventListeners[EVENTTYPE[type as keyof typeof EVENTTYPE]]!.length; i++) {
                if (this._eventListeners[EVENTTYPE[type as keyof typeof EVENTTYPE]]![i].token === token) {
                    this._eventListeners[EVENTTYPE[type as keyof typeof EVENTTYPE]]!.splice(i, 1);
                    return true;
                }
            }
        }
        return false;
    }

    // #endregion Public Methods (3)
}