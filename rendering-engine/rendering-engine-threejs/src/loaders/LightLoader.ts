import {
	AbstractLight,
	AmbientLight,
	DirectionalLight,
	HemisphereLight,
	PointLight,
	SpotLight,
} from "@shapediver/viewer.rendering-engine.light-engine";
import {IBox, ISphere} from "@shapediver/viewer.shared.math";
import * as THREE from "three";
import {ILoader} from "../interfaces/ILoader";
import {SDObject} from "../objects/SDObject";
import {RenderingEngine} from "../RenderingEngine";

export class LightLoader implements ILoader {
	// #region Properties (3)

	private _forceDisabledShadows: boolean = false;
	private _shadowMapCount = 0;

	// #endregion Properties (3)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (4)

	public get forceDisabledShadows(): boolean {
		return this._forceDisabledShadows;
	}

	public set forceDisabledShadows(value: boolean) {
		this._forceDisabledShadows = value;
	}

	public get shadowMapCount(): number {
		return this._shadowMapCount;
	}

	public set shadowMapCount(value: number) {
		this._shadowMapCount = value;
	}

	// #endregion Public Getters And Setters (4)

	// #region Public Methods (3)

	public adjustToBoundingBox(
		light: AbstractLight,
		dataChild: SDObject,
		boundingBox: IBox,
	) {
		const threeLight: THREE.Light = <THREE.Light>dataChild.children[0];

		if (light instanceof DirectionalLight) {
			const threeDirectionalLight = <THREE.DirectionalLight>threeLight;

			const bs: ISphere = boundingBox.boundingSphere;
			threeDirectionalLight.position.set(
				bs.center[0] + light.direction[0] * bs.radius * 2.35,
				bs.center[1] + light.direction[1] * bs.radius * 2.35,
				bs.center[2] + light.direction[2] * bs.radius * 2.35,
			);
			threeDirectionalLight.target.position.set(
				bs.center[0],
				bs.center[1],
				bs.center[2],
			);

			if (
				light.castShadow === true &&
				this.forceDisabledShadows === false
			) {
				threeDirectionalLight.castShadow = true;
				threeDirectionalLight.shadow.camera.up.set(0, 0, 1);
				threeDirectionalLight.shadow.camera.far = 8 * bs.radius;
				threeDirectionalLight.shadow.camera.right = 1.5 * bs.radius;
				threeDirectionalLight.shadow.camera.left = -1.5 * bs.radius;
				threeDirectionalLight.shadow.camera.top = 1.5 * bs.radius;
				threeDirectionalLight.shadow.camera.bottom = -1.5 * bs.radius;
				threeDirectionalLight.shadow.mapSize.width =
					light.shadowMapResolution;
				threeDirectionalLight.shadow.mapSize.height =
					light.shadowMapResolution;
				threeDirectionalLight.shadow.bias = light.shadowMapBias;
				threeDirectionalLight.shadow.camera.updateProjectionMatrix();
				this._shadowMapCount++;
			} else {
				threeDirectionalLight.castShadow = false;
			}
		}
	}

	public init(): void {}

	public load(light: AbstractLight, dataChild: SDObject) {
		let threeLight: THREE.Light | null =
			dataChild.children[0] instanceof THREE.Light
				? <THREE.Light>dataChild.children[0]
				: null;
		if (light instanceof AmbientLight) {
			if (!threeLight) {
				threeLight = new THREE.AmbientLight();
				light.convertedObject[this._renderingEngine.id] = <
					THREE.AmbientLight
				>threeLight;
				dataChild.add(threeLight);
			}
			const threeAmbientLight = <THREE.AmbientLight>threeLight;

			threeAmbientLight.color = this._renderingEngine.createThreeJsColor(
				light.color,
			);
			threeAmbientLight.intensity = this._renderingEngine
				.physicallyCorrectLights
				? light.intensity
				: light.intensity * Math.PI;
		}

		if (light instanceof DirectionalLight) {
			if (!threeLight) {
				threeLight = new THREE.DirectionalLight();
				dataChild.add(threeLight);
				(<THREE.DirectionalLight>threeLight).target.userData.SDid =
					light.id;
				(<THREE.DirectionalLight>threeLight).target.userData.SDversion =
					light.version;
				dataChild.add((<THREE.DirectionalLight>threeLight).target);
				light.convertedObject[this._renderingEngine.id] = <
					THREE.DirectionalLight
				>threeLight;
			}
			const threeDirectionalLight = <THREE.DirectionalLight>threeLight;

			threeDirectionalLight.color =
				this._renderingEngine.createThreeJsColor(light.color);
			threeDirectionalLight.intensity = this._renderingEngine
				.physicallyCorrectLights
				? light.intensity
				: light.intensity * Math.PI;

			if (light.useNodeData) {
				threeDirectionalLight.position.set(0, 0, 0);
				threeDirectionalLight.target.position.set(0, 0, -1);
			}
		}

		if (light instanceof HemisphereLight) {
			if (!threeLight) {
				threeLight = new THREE.HemisphereLight();
				dataChild.add(threeLight);
				light.convertedObject[this._renderingEngine.id] = <
					THREE.HemisphereLight
				>threeLight;
			}
			const threeHemisphereLight = <THREE.HemisphereLight>threeLight;

			threeHemisphereLight.color =
				this._renderingEngine.createThreeJsColor(light.color);
			threeHemisphereLight.intensity = this._renderingEngine
				.physicallyCorrectLights
				? light.intensity
				: light.intensity * Math.PI;
			threeHemisphereLight.groundColor =
				this._renderingEngine.createThreeJsColor(light.groundColor);
		}

		if (light instanceof PointLight) {
			if (!threeLight) {
				threeLight = new THREE.PointLight();
				dataChild.add(threeLight);
				light.convertedObject[this._renderingEngine.id] = <
					THREE.PointLight
				>threeLight;
			}
			const threePointLight = <THREE.PointLight>threeLight;

			threePointLight.color = this._renderingEngine.createThreeJsColor(
				light.color,
			);
			threePointLight.intensity = this._renderingEngine
				.physicallyCorrectLights
				? light.intensity
				: light.intensity * Math.PI;
			threePointLight.distance = light.distance;
			threePointLight.decay = this._renderingEngine
				.physicallyCorrectLights
				? light.decay
				: 0;
			threePointLight.position.set(
				light.position[0],
				light.position[1],
				light.position[2],
			);
		}

		if (light instanceof SpotLight) {
			if (!threeLight) {
				threeLight = new THREE.SpotLight(
					this._renderingEngine.createThreeJsColor(light.color),
					light.intensity,
					light.distance,
					light.angle,
					light.penumbra,
					light.decay,
				);
				dataChild.add(threeLight);
				dataChild.add((<THREE.SpotLight>threeLight).target);
				(<THREE.SpotLight>threeLight).target.userData.SDid = light.id;
				(<THREE.SpotLight>threeLight).target.userData.SDversion =
					light.version;
				light.convertedObject[this._renderingEngine.id] = <
					THREE.SpotLight
				>threeLight;
			}
			const threeSpotLight = <THREE.SpotLight>threeLight;

			threeSpotLight.color = this._renderingEngine.createThreeJsColor(
				light.color,
			);
			threeSpotLight.intensity = this._renderingEngine
				.physicallyCorrectLights
				? light.intensity
				: light.intensity * Math.PI;
			threeSpotLight.distance = light.distance;
			threeSpotLight.angle = light.angle;
			threeSpotLight.penumbra = light.penumbra;
			threeSpotLight.decay = this._renderingEngine.physicallyCorrectLights
				? light.decay
				: 0;

			threeSpotLight.position.set(
				light.position[0],
				light.position[1],
				light.position[2],
			);
			threeSpotLight.target.position.set(
				light.target[0],
				light.target[1],
				light.target[2],
			);
		}

		return threeLight;
	}

	// #endregion Public Methods (3)
}
