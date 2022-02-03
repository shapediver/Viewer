import * as THREE from 'three'
import { Box, Sphere } from '@shapediver/viewer.shared.math'
import {
  AbstractLight,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  PointLight,
  SpotLight,
} from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'

import { SDNode } from '../types/SDNode'
import { RenderingEngine } from '../RenderingEngine'
import { ILoader } from '../interfaces/ILoader'
import { Converter } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

export class LightLoader implements ILoader {


    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    
    private _shadowMapCount = 0;
    private _forceDisabledShadows: boolean = false;

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {}

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public init(): void {}

    public load(light: AbstractLight, parent: SDNode, scene: THREE.Scene, boundingBox: Box) {
        let converted = new SDNode(light.id, light.version);

        if (light instanceof AmbientLight) {
            const threeLight: THREE.AmbientLight = converted.children[0] instanceof THREE.AmbientLight ? (<THREE.AmbientLight>converted.children[0]) : new THREE.AmbientLight();
            if (converted.children.length === 0) converted.add(threeLight);
            threeLight.color = new THREE.Color(this._converter.toThreeJsColorInput(light.color));
            threeLight.intensity = light.intensity;
        }
        
        if (light instanceof DirectionalLight) {
            const threeLight: THREE.DirectionalLight = converted.children[0] instanceof THREE.DirectionalLight ? (<THREE.DirectionalLight>converted.children[0]) : new THREE.DirectionalLight();
            if (converted.children.length === 0) converted.add(threeLight);
            scene.add(threeLight.target);

            threeLight.color = new THREE.Color(this._converter.toThreeJsColorInput(light.color));
            threeLight.intensity = light.intensity;

            const bs: Sphere = boundingBox.boundingSphere;

            threeLight.position.set(bs.center[0] + light.direction[0] * bs.radius * 2.35, bs.center[1] + light.direction[1] * bs.radius * 2.35, bs.center[2] + light.direction[2] * bs.radius * 2.35);
            threeLight.target.position.set(bs.center[0], bs.center[1], bs.center[2]);

            if (light.castShadow === true && this.forceDisabledShadows === false) {
                threeLight.castShadow = true;
                threeLight.shadow.camera.up.set(0, 0, 1);
                threeLight.shadow.camera.far = 8 * bs.radius;
                threeLight.shadow.camera.right = 1.5 * bs.radius;
                threeLight.shadow.camera.left = -1.5 * bs.radius;
                threeLight.shadow.camera.top = 1.5 * bs.radius;
                threeLight.shadow.camera.bottom = -1.5 * bs.radius;
                threeLight.shadow.mapSize.width = light.shadowMapResolution;
                threeLight.shadow.mapSize.height = light.shadowMapResolution;
                threeLight.shadow.bias = light.shadowMapBias;
                threeLight.shadow.camera.updateProjectionMatrix();
                this._shadowMapCount++;
              } else {
                threeLight.castShadow = false;
              }
        }
        
        if (light instanceof HemisphereLight) {
            const threeLight: THREE.HemisphereLight = converted.children[0] instanceof THREE.HemisphereLight ? (<THREE.HemisphereLight>converted.children[0]) : new THREE.HemisphereLight();
            if (converted.children.length === 0) converted.add(threeLight);
            threeLight.color = new THREE.Color(this._converter.toThreeJsColorInput(light.color));
            threeLight.intensity = light.intensity;
            threeLight.groundColor = new THREE.Color(this._converter.toThreeJsColorInput(light.groundColor));
        }
        
        if (light instanceof PointLight) {
            const threeLight: THREE.PointLight = converted.children[0] instanceof THREE.PointLight ? (<THREE.PointLight>converted.children[0]) : new THREE.PointLight();
            if (converted.children.length === 0) converted.add(threeLight);
            threeLight.color = new THREE.Color(this._converter.toThreeJsColorInput(light.color));
            threeLight.intensity = light.intensity;
            threeLight.distance = light.distance;
            threeLight.decay = light.decay;
            threeLight.position.set(light.position[0], light.position[1], light.position[2]);
        }
        
        if (light instanceof SpotLight) {
            const threeLight: THREE.SpotLight = converted.children[0] instanceof THREE.SpotLight ? (<THREE.SpotLight>converted.children[0]) : 
            new THREE.SpotLight(new THREE.Color(this._converter.toThreeJsColorInput(light.color)), light.intensity, vec3.distance(light.position, light.target), light.angle, light.penumbra, light.decay)
            if (converted.children.length === 0) converted.add(threeLight);
            scene.add(threeLight.target);
            threeLight.position.set(light.position[0], light.position[1], light.position[2]);
            threeLight.target.position.set(light.target[0], light.target[1], light.target[2]);
        }

        parent.add(converted);
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