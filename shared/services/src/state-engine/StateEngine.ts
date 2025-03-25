import {ISessionGlobalAccessObjectDefinition} from "./ISessionGlobalAccessObjectDefinition";
import {IViewportGlobalAccessObjectDefinition} from "./IViewportGlobalAccessObjectDefinition";
import {StatePromise} from "./StatePromise";

export class StateEngine {
	// #region Properties (4)

	private readonly _fontLoaded: StatePromise<boolean> = new StatePromise();
	private readonly _sessionEngines: {
		[key: string]: ISessionGlobalAccessObjectDefinition | undefined;
	} = {};
	private readonly _viewportEngines: {
		[key: string]: IViewportGlobalAccessObjectDefinition | undefined;
	} = {};

	private static _instance: StateEngine;

	// #endregion Properties (4)

	// #region Constructors (1)

	private constructor() {
		this._fontLoaded = new StatePromise();
	}

	// #endregion Constructors (1)

	// #region Public Static Getters And Setters (1)

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	// #endregion Public Static Getters And Setters (1)

	// #region Public Getters And Setters (3)

	public get fontLoaded(): StatePromise<boolean> {
		return this._fontLoaded;
	}

	public get sessionEngines(): {
		[key: string]: ISessionGlobalAccessObjectDefinition | undefined;
	} {
		return this._sessionEngines;
	}

	public get viewportEngines(): {
		[key: string]: IViewportGlobalAccessObjectDefinition | undefined;
	} {
		return this._viewportEngines;
	}

	// #endregion Public Getters And Setters (3)
}
