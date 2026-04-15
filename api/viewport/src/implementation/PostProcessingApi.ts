import {
	Effect,
	EffectComposer,
	GodRaysManager,
	OutlineManager,
	RenderingEngine as RenderingEngineThreeJs,
	SelectiveBloomManager,
} from "@shapediver/viewer.rendering-engine.rendering-engine-threejs";
import {InputValidator, Logger} from "@shapediver/viewer.shared.services";
import {
	ANTI_ALIASING_TECHNIQUE,
	IPostProcessingEffectDefinition,
	IPostProcessingEffectsArray,
	POST_PROCESSING_EFFECT_TYPE,
} from "@shapediver/viewer.shared.types";
import {IPostProcessingApi} from "../interfaces/IPostProcessingApi";
import {IViewportApi} from "../interfaces/IViewportApi";

export class PostProcessingApi implements IPostProcessingApi {
	// #region Properties (4)

	readonly #inputValidator: InputValidator = InputValidator.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #renderingEngine: RenderingEngineThreeJs;
	readonly #viewportApi: IViewportApi;

	// #endregion Properties (4)

	// #region Constructors (1)

	constructor(
		viewportApi: IViewportApi,
		renderingEngine: RenderingEngineThreeJs,
	) {
		this.#viewportApi = viewportApi;
		this.#renderingEngine = renderingEngine;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (14)

	public get antiAliasingTechnique(): ANTI_ALIASING_TECHNIQUE {
		return this.#renderingEngine.postProcessingManager
			.antiAliasingTechnique;
	}

	public set antiAliasingTechnique(value: ANTI_ALIASING_TECHNIQUE) {
		const scope = "antiAliasingTechnique";
		this.#inputValidator.validateAndError(
			`PostProcessingApi.${scope}`,
			value,
			"enum",
			true,
			Object.values(ANTI_ALIASING_TECHNIQUE),
		);
		this.#renderingEngine.postProcessingManager.antiAliasingTechnique =
			value;
		this.#logger.debug(
			`PostProcessingApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get antiAliasingTechniqueMobile(): ANTI_ALIASING_TECHNIQUE {
		return this.#renderingEngine.postProcessingManager
			.antiAliasingTechniqueMobile;
	}

	public set antiAliasingTechniqueMobile(value: ANTI_ALIASING_TECHNIQUE) {
		const scope = "antiAliasingTechniqueMobile";
		this.#inputValidator.validateAndError(
			`PostProcessingApi.${scope}`,
			value,
			"enum",
			true,
			Object.values(ANTI_ALIASING_TECHNIQUE),
		);
		this.#renderingEngine.postProcessingManager.antiAliasingTechniqueMobile =
			value;
		this.#logger.debug(
			`PostProcessingApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get effectComposer(): EffectComposer | undefined {
		return this.#renderingEngine.postProcessingManager.effectComposer;
	}

	public get enablePostProcessingOnMobile(): boolean {
		return this.#renderingEngine.postProcessingManager
			.enablePostProcessingOnMobile;
	}

	public set enablePostProcessingOnMobile(value: boolean) {
		const scope = "enablePostProcessingOnMobile";
		this.#inputValidator.validateAndError(
			`PostProcessingApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.postProcessingManager.enablePostProcessingOnMobile =
			value;
		this.#logger.debug(
			`PostProcessingApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get godRaysEffects(): {
		[key: string]: GodRaysManager;
	} {
		return this.#renderingEngine.postProcessingManager.godRaysManagers;
	}

	public get manualPostProcessing(): boolean {
		return this.#renderingEngine.postProcessingManager.manualPostProcessing;
	}

	public set manualPostProcessing(value: boolean) {
		const scope = "manualPostProcessing";
		this.#inputValidator.validateAndError(
			`PostProcessingApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.postProcessingManager.manualPostProcessing =
			value;
		this.#logger.debug(
			`PostProcessingApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get outlineEffects(): {
		[key: string]: OutlineManager;
	} {
		return this.#renderingEngine.postProcessingManager.outlineManagers;
	}

	public get selectiveBloomEffects(): {
		[key: string]: SelectiveBloomManager;
	} {
		return this.#renderingEngine.postProcessingManager
			.selectiveBloomManagers;
	}

	public get ssaaSampleLevel(): number {
		return this.#renderingEngine.postProcessingManager.ssaaSampleLevel;
	}

	public set ssaaSampleLevel(value: number) {
		const scope = "ssaaSampleLevel";
		this.#inputValidator.validateAndError(
			`PostProcessingApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.postProcessingManager.ssaaSampleLevel = value;
		this.#logger.debug(
			`PostProcessingApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	// #endregion Public Getters And Setters (14)

	// #region Public Methods (7)

	public addEffect(
		definition: IPostProcessingEffectDefinition,
		token?: string,
	): string {
		const scope = "addEffect";
		this.#inputValidator.validateAndError(
			`PostProcessingApi.${scope}`,
			definition,
			"object",
			false,
		);
		const res = this.#renderingEngine.postProcessingManager.addEffect(
			definition,
			token,
		);
		this.#logger.debug(
			`PostProcessingApi.${scope}: ${scope} was called with definition ${definition}.`,
		);
		this.#viewportApi.update();
		return res;
	}

	public getDefaultEffectProperties(
		type: POST_PROCESSING_EFFECT_TYPE,
	): unknown {
		const scope = "getDefaultEffectProperties";
		this.#inputValidator.validateAndError(
			`PostProcessingApi.${scope}`,
			type,
			"enum",
			true,
			Object.values(POST_PROCESSING_EFFECT_TYPE),
		);
		this.#logger.debug(
			`PostProcessingApi.${scope}: ${scope} was called with type ${type}.`,
		);
		return this.#renderingEngine.postProcessingManager.getDefaultEffectProperties(
			type,
		);
	}

	public getEffect(token: string): Effect {
		const scope = "getEffect";
		this.#inputValidator.validateAndError(
			`PostProcessingApi.${scope}`,
			token,
			"string",
		);
		this.#logger.debug(
			`PostProcessingApi.${scope}: ${scope} was called with token ${token}.`,
		);
		return this.#renderingEngine.postProcessingManager.getEffect(token);
	}

	public getEffectTokens(): {[key: string]: POST_PROCESSING_EFFECT_TYPE} {
		return this.#renderingEngine.postProcessingManager.getEffectTokens();
	}

	public getPostProcessingEffectsArray(): IPostProcessingEffectsArray {
		const scope = "getPostProcessingEffectsArray";
		this.#logger.debug(`PostProcessingApi.${scope}: ${scope} was called.`);
		return this.#renderingEngine.postProcessingManager.getPostProcessingEffectsArray();
	}

	public removeEffect(token: string): boolean {
		const scope = "removeEffect";
		this.#inputValidator.validateAndError(
			`PostProcessingApi.${scope}`,
			token,
			"string",
		);
		const res =
			this.#renderingEngine.postProcessingManager.removeEffect(token);
		this.#logger.debug(
			`PostProcessingApi.${scope}: ${scope} was called with token ${token}.`,
		);
		this.#viewportApi.update();
		return res;
	}

	public updateEffect(
		token: string,
		definition: IPostProcessingEffectDefinition,
	): void {
		const scope = "updateEffect";
		this.#inputValidator.validateAndError(
			`PostProcessingApi.${scope}`,
			token,
			"string",
		);
		this.#renderingEngine.postProcessingManager.updateEffect(
			token,
			definition,
		);
		this.#logger.debug(
			`PostProcessingApi.${scope}: ${scope} was called with token ${token} and definition ${definition}.`,
		);
		this.#viewportApi.update();
	}

	// #endregion Public Methods (7)
}
