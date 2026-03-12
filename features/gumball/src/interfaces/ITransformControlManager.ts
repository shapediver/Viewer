import {IDomEventListener} from "@shapediver/viewer";

export interface ITransformControlManager extends IDomEventListener {
	/**
	 * Check if the Gumball is currently active.
	 */
	readonly closed: boolean;

	/**
	 * Show or hide the Gumball.
	 */
	show: boolean;

	close(): void;
}
