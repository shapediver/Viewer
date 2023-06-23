import { InputValidator, Logger } from "@shapediver/viewer.shared.services";
import { IPostProcessingApi } from "../../interfaces/viewport/IPostProcessingApi";
import { IViewportApi } from "../../interfaces/viewport/IViewportApi";
import { Effect, EffectComposer, IPostProcessingEffectDefinition, RenderingEngine as RenderingEngineThreeJs } from "@shapediver/viewer.rendering-engine-threejs.standard";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";

export class PostProcessingApi implements IPostProcessingApi {
    // #region Properties (4)

    readonly #inputValidator: InputValidator = InputValidator.instance;
    readonly #logger: Logger = Logger.instance;
    readonly #renderingEngine: RenderingEngineThreeJs;
    readonly #viewportApi: IViewportApi;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(viewportApi: IViewportApi, renderingEngine: RenderingEngineThreeJs) {
        this.#viewportApi = viewportApi;
        this.#renderingEngine = renderingEngine;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (6)

    public get effectComposer(): EffectComposer {
        return this.#renderingEngine.postProcessingManager.effectComposer;
    }

    public get godRaysEffects(): {
        [key: string]: {
            setLightSource(node: ITreeNode): void;
            removeLightSource(): void;
        }
    } {
        return this.#renderingEngine.postProcessingManager.godRaysManagers;
    }

    public get manualPostProcessing(): boolean {
        return this.#renderingEngine.postProcessingManager.manualPostProcessing;
    }

    public set manualPostProcessing(value: boolean) {
        this.#renderingEngine.postProcessingManager.manualPostProcessing = value;
    }

    public get outlineEffects(): {
        [key: string]: {
            addSelection(node: ITreeNode): void;
            removeSelection(node: ITreeNode): boolean;
            clearSelection(): void;
        }
    } {
        return this.#renderingEngine.postProcessingManager.outlineManagers;
    }

    public get selectiveBloomEffects(): {
        [key: string]: {
            addSelection(node: ITreeNode): void;
            removeSelection(node: ITreeNode): boolean;
            clearSelection(): void;
        }
    } {
        return this.#renderingEngine.postProcessingManager.selectiveBloomManagers;
    }

    public get ssaaSampleLevel(): number {
        return this.#renderingEngine.postProcessingManager.ssaaSampleLevel;
    }

    public set ssaaSampleLevel(value: number) {
        this.#renderingEngine.postProcessingManager.ssaaSampleLevel = value;
    }

    // #endregion Public Accessors (6)

    // #region Public Methods (3)

    public addEffect(definition: IPostProcessingEffectDefinition): string {
        const scope = 'addEffect';
        this.#inputValidator.validateAndError(`PostProcessingApi.${scope}`, definition, 'object', false);
        const res = this.#renderingEngine.postProcessingManager.addEffect(definition)
        this.#logger.debug(`PostProcessingApi.${scope}: ${scope} was called with definition ${definition}.`);
        this.#viewportApi.update();
        return res;
    }

    public getEffect(token: string): Effect {
        return this.#renderingEngine.postProcessingManager.getEffect(token);
    }

    public removeEffect(token: string): boolean {
        const scope = 'removeEffect';
        this.#inputValidator.validateAndError(`PostProcessingApi.${scope}`, token, 'string');
        const res = this.#renderingEngine.postProcessingManager.removeEffect(token)
        this.#logger.debug(`PostProcessingApi.${scope}: ${scope} was called with token ${token}.`);
        this.#viewportApi.update();
        return res;
    }

    public updateEffect(token: string, definition: IPostProcessingEffectDefinition): void {
        const scope = 'updateEffect';
        this.#inputValidator.validateAndError(`PostProcessingApi.${scope}`, token, 'string');
        this.#renderingEngine.postProcessingManager.updateEffect(token, definition)
        this.#logger.debug(`PostProcessingApi.${scope}: ${scope} was called with token ${token} and definition ${definition}.`);
        this.#viewportApi.update();
    }

    // #endregion Public Methods (3)
}