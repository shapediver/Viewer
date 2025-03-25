export interface IAmbientLightProperties {
	color: string | number;
	intensity: number;
}

export interface IDirectionalLightProperties {
	color: string | number;
	intensity: number;
	direction: {x: number; y: number; z: number};
	castShadow: boolean;
	shadowMapResolution: number;
	shadowMapBias: number;
}

export interface IHemisphereLightProperties {
	skyColor: string | number;
	intensity: number;
	groundColor: string | number;
}

export interface IPointLightProperties {
	color: string | number;
	intensity: number;
	position: {x: number; y: number; z: number};
	distance: number;
	decay: number;
}

export interface ISpotLightProperties {
	color: string | number;
	intensity: number;
	position: {x: number; y: number; z: number};
	target: {x: number; y: number; z: number};
	distance: number;
	decay: number;
	angle: number;
	penumbra: number;
}

export interface ILightSceneSettings {
	[key: string]: {
		name?: string;
		lights: {
			[key: string]: {
				name?: string;
				type: string;
				order?: number;
				properties:
					| IAmbientLightProperties
					| IDirectionalLightProperties
					| IHemisphereLightProperties
					| IPointLightProperties
					| ISpotLightProperties;
			};
		};
	};
}
