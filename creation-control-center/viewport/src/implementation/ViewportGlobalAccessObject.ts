import {RenderingEngine} from "@shapediver/viewer.rendering-engine.rendering-engine-threejs";
import {
	IViewportGlobalAccessObjectDefinition,
	SettingsEngine,
	StatePromise,
} from "@shapediver/viewer.shared.services";

export class ViewportGlobalAccessObject
	implements IViewportGlobalAccessObjectDefinition
{
	// #region Properties (6)

	readonly #boundingBoxCreated: StatePromise<boolean> = new StatePromise();
	readonly #initialized: StatePromise<boolean> = new StatePromise();
	readonly #settingsAssigned: StatePromise<boolean> = new StatePromise();
	readonly #viewportEngine: RenderingEngine;

	#busy: string[] = [];
	#environmentMapLoaded: StatePromise<boolean> = new StatePromise();

	// #endregion Properties (6)

	// #region Constructors (1)

	constructor(viewportEngine: RenderingEngine) {
		this.#viewportEngine = viewportEngine;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (9)

	public get boundingBoxCreated(): StatePromise<boolean> {
		return this.#boundingBoxCreated;
	}

	public get busy(): string[] {
		return this.#busy;
	}

	public get environmentMapLoaded(): StatePromise<boolean> {
		return this.#environmentMapLoaded;
	}

	public set environmentMapLoaded(value: StatePromise<boolean>) {
		this.#environmentMapLoaded = value;
	}

	public get id(): string {
		return this.#viewportEngine.id;
	}

	public get initialized(): StatePromise<boolean> {
		return this.#initialized;
	}

	public get sessionSettingsId(): string | undefined {
		return this.#viewportEngine.sessionSettingsId;
	}

	public get sessionSettingsMode() {
		return this.#viewportEngine.sessionSettingsMode;
	}

	public get settingsAssigned(): StatePromise<boolean> {
		return this.#settingsAssigned;
	}

	// #endregion Public Getters And Setters (9)

	// #region Public Methods (6)

	public applySettings(
		sections?:
			| {
					ar?: boolean | undefined;
					scene?: boolean | undefined;
					camera?: boolean | undefined;
					light?: boolean | undefined;
					environment?: boolean | undefined;
					general?: boolean | undefined;
					postprocessing?: boolean | undefined;
			  }
			| undefined,
		settingsEngine?: SettingsEngine | undefined,
		updateViewport?: boolean | undefined,
	): Promise<void> {
		return this.#viewportEngine.applySettings(
			sections,
			settingsEngine,
			updateViewport,
		);
	}

	public assignSettingsEngine(settingsEngine: SettingsEngine): void {
		this.#viewportEngine.assignSettingsEngine(settingsEngine);
	}

	public displayErrorMessage(message: string): void {
		this.#viewportEngine.displayErrorMessage(message);
	}

	public reset(): void {
		this.#viewportEngine.reset();
	}

	public saveSettings(): void {
		this.#viewportEngine.saveSettings();
	}

	public update(id: string): void {
		this.#viewportEngine.update(id);
	}

	// #endregion Public Methods (6)
}
