import { vec3 } from "gl-matrix";
import { IAmbientLight, IDirectionalLight, IHemisphereLight, ILightScene, IPointLight, ISpotLight, LIGHT_TYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { AmbientLightApi } from "./types/AmbientLightApi";
import { DirectionalLightApi } from "./types/DirectionalLightApi";
import { HemisphereLightApi } from "./types/HemisphereLightApi";
import { PointLightApi } from "./types/PointLightApi";
import { SpotLightApi } from "./types/SpotLightApi";
import { ILightApi } from "../../../interfaces/viewport/lights/ILightApi";
import { IAmbientLightApi } from "../../../interfaces/viewport/lights/types/IAmbientLightApi";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { ISpotLightApi } from "../../../interfaces/viewport/lights/types/ISpotLightApi";
import { IPointLightApi } from "../../../interfaces/viewport/lights/types/IPointLightApi";
import { IHemisphereLightApi } from "../../../interfaces/viewport/lights/types/IHemisphereLightApi";
import { IDirectionalLightApi } from "../../../interfaces/viewport/lights/types/IDirectionalLightApi";
import { container } from "tsyringe";
import { InputValidator, ShapeDiverViewerError, ShapeDiverBackendError, LOGGING_TOPIC, Logger } from "@shapediver/viewer.shared.services";
import { ILightSceneApi } from "../../../interfaces/viewport/lights/ILightSceneApi";
import { IViewportApi } from "../../../interfaces/viewport/IViewportApi";

export class LightSceneApi implements ILightSceneApi {
    // #region Properties (15)

    readonly #lightScene: ILightScene;
    readonly #lights: { [key: string]: ILightApi; } = {};
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewportApi: IViewportApi;
    
    // #endregion Properties (15)

    // #region Constructors (1)

    constructor(viewportApi: IViewportApi, lightScene: ILightScene) {
        this.#viewportApi = viewportApi;
        this.#lightScene = lightScene;
        
        // Whenever a light is added or removed from the light scene, this update is called.
        this.#lightScene.update = () => {
            for (let l in this.#lightScene.lights) {
                if (!this.#lights[l]) {
                    switch (this.#lightScene.lights[l].type) {
                        case LIGHT_TYPE.AMBIENT:
                            this.#lights[l] = new AmbientLightApi(this.#viewportApi, <IAmbientLight>this.#lightScene.lights[l]);
                            break;
                        case LIGHT_TYPE.DIRECTIONAL:
                            this.#lights[l] = new DirectionalLightApi(this.#viewportApi, <IDirectionalLight>this.#lightScene.lights[l]);
                            break;
                        case LIGHT_TYPE.HEMISPHERE:
                            this.#lights[l] = new HemisphereLightApi(this.#viewportApi, <IHemisphereLight>this.#lightScene.lights[l]);
                            break;
                        case LIGHT_TYPE.POINT:
                            this.#lights[l] = new PointLightApi(this.#viewportApi, <IPointLight>this.#lightScene.lights[l]);
                            break;
                        case LIGHT_TYPE.SPOT:
                            this.#lights[l] = new SpotLightApi(this.#viewportApi, <ISpotLight>this.#lightScene.lights[l]);
                            break;
                    }
                }
            }

            for (let l in this.#lights) {
                if (!this.#lightScene.lights[l]) {
                    delete this.#lights[l];
                }
            }
        }

        // We call it once in the beginning to get the current state.
        this.#lightScene.update();
    }

    // #endregion Constructors (1)


    // #region Public Accessors (8)

    public get id(): string {
        return this.#lightScene.id;
    }

    public get lights(): { [key: string]: ILightApi; } {
        return this.#lights;
    }

    public get name(): string | undefined {
        return this.#lightScene.name;
    }

    public set name(value: string | undefined) {
        const scope = 'name';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, value, 'string', false);
            this.#lightScene.name = value;
            this.#logger.debug(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, e);
        }
    }

    public get node(): ITreeNode {
        return this.#lightScene.node;
    }

    // #endregion Public Accessors (8)

    // #region Public Methods (6)

    public addAmbientLight(properties: { color?: string | number | vec3 | undefined; intensity?: number | undefined; id?: string | undefined; name?: string | undefined; }): IAmbientLightApi {
        const scope = 'addAmbientLight';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, properties, 'object', false);
            const prop = Object.assign({}, properties);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.color, 'color', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.intensity, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.id, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.name, 'string', false);
            const light = this.#lightScene.addAmbientLight(properties);
            this.#viewportApi.update();
            return <IAmbientLightApi>this.#lights[light.id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, e);
        }
    }

    public addDirectionalLight(properties: { color?: string | number | vec3 | undefined; intensity?: number | undefined; direction?: vec3 | undefined; castShadow?: boolean | undefined; shadowMapResolution?: number | undefined; shadowMapBias?: number | undefined; id?: string | undefined; name?: string | undefined; }): IDirectionalLightApi {
        const scope = 'addDirectionalLight';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, properties, 'object', false);
            const prop = Object.assign({}, properties);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.color, 'color', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.intensity, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.direction, 'vec3', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.castShadow, 'boolean', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.shadowMapResolution, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.shadowMapBias, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.id, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.name, 'string', false);
            const light = this.#lightScene.addDirectionalLight(properties);
            this.#viewportApi.update();
            return <IDirectionalLightApi>this.#lights[light.id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, e);
        }
    }

    public addHemisphereLight(properties: { color?: string | number | vec3 | undefined; intensity?: number | undefined; groundColor?: string | number | vec3 | undefined; id?: string | undefined; name?: string | undefined; }): IHemisphereLightApi {
        const scope = 'addHemisphereLight';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, properties, 'object', false);
            const prop = Object.assign({}, properties);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.color, 'color', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.intensity, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.groundColor, 'color', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.id, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.name, 'string', false);
            const light = this.#lightScene.addHemisphereLight(properties);
            this.#viewportApi.update();
            return <IHemisphereLightApi>this.#lights[light.id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, e);
        }
    }

    public addPointLight(properties: { color?: string | number | vec3 | undefined; intensity?: number | undefined; position?: vec3 | undefined; distance?: number | undefined; decay?: number | undefined; id?: string | undefined; name?: string | undefined; }): IPointLightApi {
        const scope = 'addPointLight';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, properties, 'object', false);
            const prop = Object.assign({}, properties);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.color, 'color', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.intensity, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.position, 'vec3', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.distance, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.decay, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.id, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.name, 'string', false);
            const light = this.#lightScene.addPointLight(properties);
            this.#viewportApi.update();
            return <IPointLightApi>this.#lights[light.id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, e);
        }
    }

    public addSpotLight(properties: { color?: string | number | vec3 | undefined; intensity?: number | undefined; position?: vec3 | undefined; target?: vec3 | undefined; distance?: number | undefined; decay?: number | undefined; angle?: number | undefined; penumbra?: number | undefined; id?: string | undefined; name?: string | undefined; }): ISpotLightApi {
        const scope = 'addSpotLight';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, properties, 'object', false);
            const prop = Object.assign({}, properties);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.color, 'color', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.intensity, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.position, 'vec3', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.target, 'vec3', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.distance, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.decay, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.angle, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.penumbra, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.id, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, prop.name, 'string', false);
            const light = this.#lightScene.addSpotLight(properties);
            this.#viewportApi.update();
            return <ISpotLightApi>this.#lights[light.id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `LightSceneApi.${scope}`, e);
        }
    }

    public removeLight(id: string): boolean {
        const check = this.#lightScene.removeLight(id);
        this.#viewportApi.update();
        return check;
    }

    // #endregion Public Methods (6)
}