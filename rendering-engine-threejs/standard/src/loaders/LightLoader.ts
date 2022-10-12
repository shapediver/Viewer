import * as THREE from 'three'
import { Box, IBox, ISphere, Sphere } from '@shapediver/viewer.shared.math'
import {
  AbstractLight,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  PointLight,
  SpotLight,
} from '@shapediver/viewer.rendering-engine.light-engine'

import { RenderingEngine } from '../RenderingEngine'
import { ILoader } from '../interfaces/ILoader'
import { Converter } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'
import { SDData } from '../objects/SDData'

export class LightLoader implements ILoader {


    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    
    private _shadowMapCount = 0;
    private _forceDisabledShadows: boolean = false;

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {}

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public init(): void {}

    public load(light: AbstractLight, dataChild: SDData) {
        let threeLight: THREE.Light | null = dataChild.children[0] instanceof THREE.Light ? <THREE.Light>dataChild.children[0] : null;
        if (light instanceof AmbientLight) {
            if(!threeLight) {
                threeLight = new THREE.AmbientLight();
                (<AmbientLight>light).threeJsObject[this._renderingEngine.id] = <THREE.AmbientLight>threeLight;
                dataChild.add(threeLight);
            }
            const threeAmbientLight = <THREE.AmbientLight>threeLight;

            threeAmbientLight.color = new THREE.Color(this._converter.toThreeJsColorInput(light.color));
            threeAmbientLight.intensity = light.intensity;
        }
        
        if (light instanceof DirectionalLight) {
            if(!threeLight) {
                threeLight = new THREE.DirectionalLight();
                dataChild.add(threeLight);
                dataChild.add((<THREE.DirectionalLight>threeLight).target);
                (<DirectionalLight>light).threeJsObject[this._renderingEngine.id] = <THREE.DirectionalLight>threeLight;
            }
            const threeDirectionalLight = <THREE.DirectionalLight>threeLight;

            threeDirectionalLight.color = new THREE.Color(this._converter.toThreeJsColorInput(light.color));
            threeDirectionalLight.intensity = light.intensity;

            if(light.useNodeData) {
                threeDirectionalLight.position.set(0,0,0);
                threeDirectionalLight.target.position.set(0,0,-1);
            }
        }
        
        if (light instanceof HemisphereLight) {
            if(!threeLight) {
                threeLight = new THREE.HemisphereLight();
                dataChild.add(threeLight);
                (<HemisphereLight>light).threeJsObject[this._renderingEngine.id] = <THREE.HemisphereLight>threeLight;
            }
            const threeHemisphereLight = <THREE.HemisphereLight>threeLight;

            threeHemisphereLight.color = new THREE.Color(this._converter.toThreeJsColorInput(light.color));
            threeHemisphereLight.intensity = light.intensity;
            threeHemisphereLight.groundColor = new THREE.Color(this._converter.toThreeJsColorInput(light.groundColor));
        }
        
        if (light instanceof PointLight) {
            if(!threeLight) {
                threeLight = new THREE.PointLight();
                dataChild.add(threeLight);
                (<PointLight>light).threeJsObject[this._renderingEngine.id] = <THREE.PointLight>threeLight;
            }
            const threePointLight = <THREE.PointLight>threeLight;

            threePointLight.color = new THREE.Color(this._converter.toThreeJsColorInput(light.color));
            threePointLight.intensity = light.intensity;
            threePointLight.distance = light.distance;
            threePointLight.decay = light.decay;
            threePointLight.position.set(light.position[0], light.position[1], light.position[2]);
        }
        
        if (light instanceof SpotLight) {
            if(!threeLight) {
                threeLight = new THREE.SpotLight(
                    new THREE.Color(this._converter.toThreeJsColorInput(light.color)), 
                    light.intensity, 
                    light.distance, 
                    light.angle, 
                    light.penumbra, 
                    light.decay
                );
                dataChild.add(threeLight);
                dataChild.add((<THREE.SpotLight>threeLight).target);
                (<SpotLight>light).threeJsObject[this._renderingEngine.id] = <THREE.SpotLight>threeLight;
            }
            const threeSpotLight = <THREE.SpotLight>threeLight;

            threeSpotLight.color = new THREE.Color(this._converter.toThreeJsColorInput(light.color));
            threeSpotLight.intensity = light.intensity;
            threeSpotLight.distance = light.distance;
            threeSpotLight.angle = light.angle;
            threeSpotLight.penumbra = light.penumbra;
            threeSpotLight.decay = light.decay;

            threeSpotLight.position.set(light.position[0], light.position[1], light.position[2]);
            threeSpotLight.target.position.set(light.target[0], light.target[1], light.target[2]);
        }
    }

    public adjustToBoundingBox(light: AbstractLight, dataChild: SDData, boundingBox: IBox) {
        let threeLight: THREE.Light = <THREE.Light>dataChild.children[0];

        if (light instanceof DirectionalLight) {
            const threeDirectionalLight = <THREE.DirectionalLight>threeLight;

            const bs: ISphere = boundingBox.boundingSphere;
            threeDirectionalLight.position.set(bs.center[0] + light.direction[0] * bs.radius * 2.35, bs.center[1] + light.direction[1] * bs.radius * 2.35, bs.center[2] + light.direction[2] * bs.radius * 2.35);
            threeDirectionalLight.target.position.set(bs.center[0], bs.center[1], bs.center[2]);

            if (light.castShadow === true && this.forceDisabledShadows === false) {
                threeDirectionalLight.castShadow = true;
                threeDirectionalLight.shadow.camera.up.set(0, 0, 1);
                threeDirectionalLight.shadow.camera.far = 8 * bs.radius;
                threeDirectionalLight.shadow.camera.right = 1.5 * bs.radius;
                threeDirectionalLight.shadow.camera.left = -1.5 * bs.radius;
                threeDirectionalLight.shadow.camera.top = 1.5 * bs.radius;
                threeDirectionalLight.shadow.camera.bottom = -1.5 * bs.radius;
                threeDirectionalLight.shadow.mapSize.width = light.shadowMapResolution;
                threeDirectionalLight.shadow.mapSize.height = light.shadowMapResolution;
                threeDirectionalLight.shadow.bias = light.shadowMapBias;
                threeDirectionalLight.shadow.camera.updateProjectionMatrix();
                this._shadowMapCount++;
            } else {
                threeDirectionalLight.castShadow = false;
            }
        }
    }

    public get shadowMapCount(): number {
        return this._shadowMapCount;
    }

    public set shadowMapCount(value: number) {
        this._shadowMapCount = value;
    }

    public get forceDisabledShadows(): boolean {
        return this._forceDisabledShadows;
    }

    public set forceDisabledShadows(value: boolean) {
        this._forceDisabledShadows = value;
    }

    // #endregion Public Methods (2)
}