import { vec3 } from "gl-matrix";
import { IAmbientLight, IDirectionalLight, IHemisphereLight, ILightScene, IPointLight, ISpotLight, LIGHT_TYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { ILightSceneApi } from "../../../interfaces/viewport/lights/ILightSceneApi";
import { AmbientLightApi } from "./types/AmbientLightApi";
import { DirectionalLightApi } from "./types/DirectionalLightApi";
import { HemisphereLightApi } from "./types/HemisphereLightApi";
import { PointLightApi } from "./types/PointLightApi";
import { SpotLightApi } from "./types/SpotLightApi";
import { IViewportApi } from "../../../interfaces/viewport/IViewportApi";
import { ILightApi } from "../../../interfaces/viewport/lights/ILightApi";
import { IAmbientLightApi } from "../../../interfaces/viewport/lights/types/IAmbientLightApi";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { ISpotLightApi } from "../../../interfaces/viewport/lights/types/ISpotLightApi";
import { IPointLightApi } from "../../../interfaces/viewport/lights/types/IPointLightApi";
import { IHemisphereLightApi } from "../../../interfaces/viewport/lights/types/IHemisphereLightApi";
import { IDirectionalLightApi } from "../../../interfaces/viewport/lights/types/IDirectionalLightApi";

export class LightSceneApi implements ILightSceneApi {
    // #region Properties (15)

    readonly #lightScene: ILightScene;
    readonly #lights: { [key: string]: ILightApi; } = {};

    // #endregion Properties (15)

    // #region Constructors (1)

    constructor(lightScene: ILightScene) {
        this.#lightScene = lightScene;
        
        // Whenever a light is added or removed from the light scene, this update is called.
        this.#lightScene.update = () => {
            for (let l in this.#lightScene.lights) {
                if (!this.#lights[l]) {
                    switch (this.#lightScene.lights[l].type) {
                        case LIGHT_TYPE.AMBIENT:
                            this.#lights[l] = new AmbientLightApi(<IAmbientLight>this.#lightScene.lights[l]);
                            break;
                        case LIGHT_TYPE.DIRECTIONAL:
                            this.#lights[l] = new DirectionalLightApi(<IDirectionalLight>this.#lightScene.lights[l]);
                            break;
                        case LIGHT_TYPE.HEMISPHERE:
                            this.#lights[l] = new HemisphereLightApi(<IHemisphereLight>this.#lightScene.lights[l]);
                            break;
                        case LIGHT_TYPE.POINT:
                            this.#lights[l] = new PointLightApi(<IPointLight>this.#lightScene.lights[l]);
                            break;
                        case LIGHT_TYPE.SPOT:
                            this.#lights[l] = new SpotLightApi(<ISpotLight>this.#lightScene.lights[l]);
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

    public set id(value: string) {
        this.#lightScene.id = value;
    }

    public get lights(): { [key: string]: ILightApi; } {
        return this.#lights;
    }

    public get name(): string | undefined {
        return this.#lightScene.name;
    }

    public set name(value: string | undefined) {
        this.#lightScene.name = value;
    }

    public get node(): ITreeNode {
        return this.#lightScene.node;
    }

    public set node(value: ITreeNode) {
        this.#lightScene.node = value;
    }

    // #endregion Public Accessors (8)

    // #region Public Methods (6)

    public addAmbientLight(properties: { color?: string | number | vec3 | undefined; intensity?: number | undefined; id?: string | undefined; name?: string | undefined; }): IAmbientLightApi {
        const light = this.#lightScene.addAmbientLight(properties);
        return <IAmbientLightApi>this.#lights[light.id];
    }

    public addDirectionalLight(properties: { color?: string | number | vec3 | undefined; intensity?: number | undefined; direction?: vec3 | undefined; castShadow?: boolean | undefined; shadowMapResolution?: number | undefined; shadowMapBias?: number | undefined; id?: string | undefined; name?: string | undefined; }): IDirectionalLightApi {
        const light = this.#lightScene.addDirectionalLight(properties);
        return <IDirectionalLightApi>this.#lights[light.id];
    }

    public addHemisphereLight(properties: { color?: string | number | vec3 | undefined; intensity?: number | undefined; groundColor?: string | number | vec3 | undefined; id?: string | undefined; name?: string | undefined; }): IHemisphereLightApi {
        const light = this.#lightScene.addHemisphereLight(properties);
        return <IHemisphereLightApi>this.#lights[light.id];
    }

    public addPointLight(properties: { color?: string | number | vec3 | undefined; intensity?: number | undefined; position?: vec3 | undefined; distance?: number | undefined; decay?: number | undefined; id?: string | undefined; name?: string | undefined; }): IPointLightApi {
        const light = this.#lightScene.addPointLight(properties);
        return <IPointLightApi>this.#lights[light.id];
    }

    public addSpotLight(properties: { color?: string | number | vec3 | undefined; intensity?: number | undefined; position?: vec3 | undefined; target?: vec3 | undefined; distance?: number | undefined; decay?: number | undefined; angle?: number | undefined; penumbra?: number | undefined; id?: string | undefined; name?: string | undefined; }): ISpotLightApi {
        const light = this.#lightScene.addSpotLight(properties);
        return <ISpotLightApi>this.#lights[light.id];
    }

    public removeLight(id: string): boolean {
        return this.#lightScene.removeLight(id);
    }

    // #endregion Public Methods (6)
}