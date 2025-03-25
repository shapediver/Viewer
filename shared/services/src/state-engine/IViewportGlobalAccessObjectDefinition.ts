import {
	SESSION_SETTINGS_MODE,
	SettingsEngine,
} from "../settings-engine/SettingsEngine";
import {StatePromise} from "./StatePromise";

/**
 * Interface for the global access definition of a viewport.
 * This interface is used to define the properties and methods that are available via the state engine for a viewport.
 * This means that they can be called without having a direct reference to the viewport engine.
 */
export interface IViewportGlobalAccessObjectDefinition {
	// #region Properties (14)

	readonly boundingBoxCreated: StatePromise<boolean>;
	readonly busy: string[];
	readonly id: string;
	readonly initialized: StatePromise<boolean>;
	readonly sessionSettingsId?: string;
	readonly sessionSettingsMode: SESSION_SETTINGS_MODE;
	readonly settingsAssigned: StatePromise<boolean>;

	applySettings: (
		sections?: {
			ar?: boolean;
			scene?: boolean;
			camera?: boolean;
			light?: boolean;
			environment?: boolean;
			general?: boolean;
			postprocessing?: boolean;
		},
		settingsEngine?: SettingsEngine,
		updateViewport?: boolean,
	) => Promise<void>;
	assignSettingsEngine: (settingsEngine: SettingsEngine) => void;
	displayErrorMessage: (message: string) => void;
	environmentMapLoaded: StatePromise<boolean>;
	reset: () => void;
	saveSettings: (settingsEngine?: SettingsEngine) => void;
	update: (id: string) => void;

	// #endregion Properties (14)
}
