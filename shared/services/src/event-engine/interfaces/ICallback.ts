import {IEvent} from "@shapediver/viewer.shared.types";

export interface ICallback {
	(event: IEvent): void;
}
