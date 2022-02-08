import {
  ILightScene as LightSceneLogic,
  LightScene as LightSceneLogicImplementation,
} from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'
import { Converter, InputValidator, Logger, LOGGINGTOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import {
  AmbientLight as AmbientLightLogic,
  DirectionalLight as DirectionalLightLogic,
  HemisphereLight as HemisphereLightLogic,
  LIGHTTYPE,
  PointLight as PointLightLogic,
  SpotLight as SpotLightLogic,
} from '@shapediver/viewer.rendering-engine.light-engine'

import { ILightScene } from '../../../interfaces/viewer/lights/ILightScene'
import { ILight } from '../../../interfaces/viewer/lights/ILight'
import { IViewer } from '../../../interfaces/viewer/IViewer'
import { IAmbientLight } from '../../../interfaces/viewer/lights/IAmbientLight'
import { IDirectionalLight } from '../../../interfaces/viewer/lights/IDirectionalLight'
import { IHemisphereLight } from '../../../interfaces/viewer/lights/IHemisphereLight'
import { IPointLight } from '../../../interfaces/viewer/lights/IPointLight'
import { ISpotLight } from '../../../interfaces/viewer/lights/ISpotLight'
import { AmbientLight } from './AmbientLight'
import { DirectionalLight } from './DirectionalLight'
import { HemisphereLight } from './HemisphereLight'
import { PointLight } from './PointLight'
import { SpotLight } from './SpotLight'

export class LightScene implements ILightScene {
    // #region Properties (6)

    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #lightSceneLogic: LightSceneLogic;
    readonly #lights: { [key: string]: ILight; } = {};
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: IViewer;

    // #endregion Properties (6)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(lightSceneLogic: LightSceneLogic, viewer: IViewer) {
        this.#lightSceneLogic = lightSceneLogic;
        this.#viewer = viewer;
        this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `LightScene(${this.id}).constructor: LightScene api created.`);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (5)

    public get id(): string {
        return this.#lightSceneLogic.id;
    }

    public get lights(): { [key: string]: ILight; } {
        const lightLogics = this.#lightSceneLogic.lights;
        for (let l in lightLogics) {
            if (this.#lights[l]) continue;
            switch (lightLogics[l].type) {
                case LIGHTTYPE.AMBIENT:
                    this.#lights[l] = new AmbientLight(<AmbientLightLogic>lightLogics[l], this.#viewer);
                    break;
                case LIGHTTYPE.DIRECTIONAL:
                    this.#lights[l] = new DirectionalLight(<DirectionalLightLogic>lightLogics[l], this.#viewer);
                    break;
                case LIGHTTYPE.HEMISPHERE:
                    this.#lights[l] = new HemisphereLight(<HemisphereLightLogic>lightLogics[l], this.#viewer);
                    break;
                case LIGHTTYPE.POINT:
                    this.#lights[l] = new PointLight(<PointLightLogic>lightLogics[l], this.#viewer);
                    break;
                case LIGHTTYPE.SPOT:
                    this.#lights[l] = new SpotLight(<SpotLightLogic>lightLogics[l], this.#viewer);
                    break;
            }
        }

        for (let l in this.#lights) {
            if (!lightLogics[l])
                delete this.#lights[l];
        }
        return this.#lights;
    }

    public get name(): string | undefined {
        return this.#lightSceneLogic.name;
    }

    public set name(value: string | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `LightScene(${this.id}).name: Updating Name to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `LightScene(${this.id}).name`, value, 'string', false);
            this.#lightSceneLogic.name = value;
            this.#logger.debug(LOGGINGTOPIC.LIGHT, `LightScene(${this.id}).name: name was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).name`, e);
        }
    }

    public get node(): TreeNode {
        return this.#lightSceneLogic.node;
    }

    // #endregion Public Accessors (5)

    // #region Public Methods (6)

    /**
     * Add an ambient light with the specified properties to the current light scene.
     * An id can be provided. If not, a unique id will be created.
     * 
     * @param properties.color the color of the light
     * @param properties.intensity the intensity of the light
     * @returns 
     */
    public addAmbientLight(properties: { color?: string | number | vec3, intensity?: number, name?: string }): IAmbientLight {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addAmbientLight: Adding light with properties ${properties}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addAmbientLight`, properties, 'object', false);
            const props = Object.assign({}, properties);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addAmbientLight`, props.color, 'color', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addAmbientLight`, props.intensity, 'positive', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addAmbientLight`, props.name, 'string', false);
            if (props.color !== undefined) props.color = this.#converter.toColor(props.color);
            const lightLogic = this.#lightSceneLogic.addAmbientLight(<any>props);
            const light = this.lights[lightLogic.id];
            this.#logger.debug(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addAmbientLight: Ambient light with id ${light.id} created.`);
            this.#viewer.update();
            return <IAmbientLight>light;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).addAmbientLight`, e);
        }
    }

    /**
     * Add a directional light with the specified properties to the current light scene.
     * An id can be provided. If not, a unique id will be created.
     * 
     * @param properties.color the color of the light
     * @param properties.intensity the intensity of the light
     * @param properties.direction the directional of the light
     * @param properties.castShadow the option to cast shadow
     * @param properties.shadowMapResolution the resolution of the shadow map
     * @param properties.shadowMapBias the bias of the shadow map
     * @returns 
     */
    public addDirectionalLight(properties: { color?: string | number | vec3, intensity?: number, direction?: vec3, castShadow?: boolean, shadowMapResolution?: number, shadowMapBias?: number, name?: string }): IDirectionalLight {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight: Adding light with properties ${properties}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, properties, 'object', false);
            const props = Object.assign({}, properties);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.color, 'color', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.intensity, 'positive', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.direction, 'vec3', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.castShadow, 'boolean', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.shadowMapResolution, 'positive', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.shadowMapBias, 'number', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.name, 'string', false);
            if (props.color !== undefined) props.color = this.#converter.toColor(props.color);
            const lightLogic = this.#lightSceneLogic.addDirectionalLight(<any>props);
            const light = this.lights[lightLogic.id];
            this.#logger.debug(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight: Directional light with id ${light.id} created.`);
            this.#viewer.update();
            return <IDirectionalLight>light;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).addDirectionalLight`, e);
        }
    }

    /**
     * Add a hemisphere light with the specified properties to the current light scene.
     * An id can be provided. If not, a unique id will be created.
     * 
     * @param properties.color the color of the light
     * @param properties.intensity the intensity of the light
     * @param properties.groundColor the ground color of the light
     * @returns 
     */
    public addHemisphereLight(properties: { color?: string | number | vec3, intensity?: number, groundColor?: string | number | vec3, name?: string }): IHemisphereLight {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight: Adding light with properties ${properties}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight`, properties, 'object', false);
            const props = Object.assign({}, properties);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight`, props.color, 'color', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight`, props.groundColor, 'color', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight`, props.intensity, 'positive', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight`, props.name, 'string', false);
            if (props.color !== undefined) props.color = this.#converter.toColor(props.color);
            if (props.groundColor !== undefined) props.groundColor = this.#converter.toColor(props.groundColor);
            const lightLogic = this.#lightSceneLogic.addHemisphereLight(<any>props);
            const light = this.lights[lightLogic.id];
            this.#logger.debug(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight: Hemisphere light with id ${light.id} created.`);
            this.#viewer.update();
            return <IHemisphereLight>light;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).addHemisphereLight`, e);
        }
    }

    /**
     * Add a point light with the specified properties to the current light scene.
     * An id can be provided. If not, a unique id will be created.
     * 
     * @param properties.color the color of the light
     * @param properties.intensity the intensity of the light
     * @param properties.position the position of the light
     * @param properties.distance the distance of the light radiance
     * @param properties.decay the decay of the light radiance
     * @returns 
     */
    public addPointLight(properties: { color?: string | number | vec3, intensity?: number, position?: vec3, distance?: number, decay?: number, name?: string }): IPointLight {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight: Adding light with properties ${properties}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, properties, 'object', false);
            const props = Object.assign({}, properties);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, props.color, 'color', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, props.intensity, 'positive', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, props.position, 'vec3', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, props.distance, 'positive', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, props.decay, 'positive', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, props.name, 'string', false);
            if (props.color !== undefined) props.color = this.#converter.toColor(props.color);
            const lightLogic = this.#lightSceneLogic.addPointLight(<any>props);
            const light = this.lights[lightLogic.id];
            this.#logger.debug(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight: Point light with id ${light.id} created.`);
            this.#viewer.update();
            return <IPointLight>light;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).addPointLight`, e);
        }
    }

    /**
     * Add a spot light with the specified properties to the current light scene.
     * An id can be provided. If not, a unique id will be created.
     * 
     * @param properties.color the color of the light
     * @param properties.intensity the intensity of the light
     * @param properties.position the position of the light
     * @param properties.target the target of the light
     * @param properties.distance the distance of the light radiance
     * @param properties.decay the decay of the light radiance
     * @param properties.angle the angle of the light cone
     * @param properties.penumbra the percentage of the cone that is part of the penumbra
     * @returns 
     */
    public addSpotLight(properties?: { color?: string | number | vec3, intensity?: number, position?: vec3, target?: vec3, distance?: number, decay?: number, angle?: number, penumbra?: number, name?: string }): ISpotLight {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight: Adding light with properties ${properties}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, properties, 'object', false);
            const props = Object.assign({}, properties);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.color, 'color', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.intensity, 'positive', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.position, 'vec3', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.target, 'vec3', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.distance, 'positive', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.decay, 'positive', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.angle, 'positive', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.penumbra, 'positive', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.name, 'string', false);
            if (props.color !== undefined) props.color = this.#converter.toColor(props.color);

            const lightLogic = this.#lightSceneLogic.addSpotLight(<any>props);
            const light = this.lights[lightLogic.id];

            this.#logger.debug(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight: Spot light with id ${light.id} created.`);
            this.#viewer.update();
            return <ISpotLight>light;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).addSpotLight`, e);
        }
    }

    /**
     * Remove the light with the specified id from the current light scene.
     * 
     * @param id the id of the light
     * @returns 
     */
    public removeLight(id: string): boolean {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLight: Removing Light with id ${id}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLight`, id, 'string');
            const r = this.#lightSceneLogic.removeLight(id);
            if (r) this.#logger.debug(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLight: Light with id ${id} removed.`);
            if (!r) this.#logger.debug(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLight: Could not remove light with id ${id}.`);
            this.#viewer.update();
            return r;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).removeLight`, e);
        }
    }

    // #endregion Public Methods (6)
}