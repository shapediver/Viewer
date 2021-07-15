import { IEvent } from './IEvent'

export interface ICallback {
    (event: IEvent): void;
}