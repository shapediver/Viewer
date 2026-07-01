import {v4} from "uuid";
import {type versions} from "../..";
import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {Defaults as DefaultsV2} from "../v2/Defaults";
import {type ISettings as ISettingsV2} from "../v2/ISettings";
import {Defaults as DefaultsV3} from "./Defaults";
import {
	type IOrthographicCameraSettings,
	type IPerspectiveCameraSettings} from "./ICameraSettings";
import {
	type IAmbientLightProperties,
	type IDirectionalLightProperties,
	type IHemisphereLightProperties,
	type IPointLightProperties,
	type ISpotLightProperties} from "./ILightSceneSettings";
import {type ISettings as ISettingsV3} from "./ISettings";

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const settings = DefaultsV3();
	const oldSettings = <ISettingsV2>s;

	settings.build_date = oldSettings.build_date;
	settings.build_version = oldSettings.build_version;

	if (oldSettings.parameters && oldSettings.parameters.controlNames) {
		for (let id in oldSettings.parameters.controlNames) {
			settings.session[id] = {
				order: 0,
				displayname: oldSettings.parameters.controlNames[id],
				hidden: false,
			};
		}
	}

	if (oldSettings.parameters && oldSettings.parameters.controlOrder) {
		for (let i = 0; i < oldSettings.parameters.controlOrder.length; i++) {
			const id = oldSettings.parameters.controlOrder[i];
			if (settings.session[id]) {
				settings.session[id].order = i;
			} else {
				settings.session[id] = {
					order: i,
					displayname: "",
					hidden: false,
				};
			}
		}
	}

	if (oldSettings.parameters && oldSettings.parameters.parametersHidden) {
		for (
			let i = 0;
			i < oldSettings.parameters.parametersHidden.length;
			i++
		) {
			const id = oldSettings.parameters.parametersHidden[i];
			if (settings.session[id]) {
				settings.session[id].hidden = true;
			} else {
				settings.session[id] = {
					order: 0,
					displayname: "",
					hidden: true,
				};
			}
		}
	}

	settings.general.blurWhenBusy = oldSettings.viewer.blurSceneWhenBusy;
	settings.general.commitParameters = oldSettings.viewer.commitParameters;
	settings.general.commitSettings = oldSettings.viewer.commitSettings;
	if (oldSettings.viewer.showMessages)
		settings.general.showMessages = oldSettings.viewer.showMessages;

	settings.environmentGeometry.gridVisibility =
		oldSettings.viewer.scene.gridVisibility;
	settings.environmentGeometry.groundPlaneVisibility =
		oldSettings.viewer.scene.groundPlaneVisibility;

	const id = v4();
	settings.camera.cameraId = id;
	if (oldSettings.viewer.scene.camera.cameraTypes.active === 0) {
		const orbitRestriction =
			oldSettings.viewer.scene.camera.controls.orbit.restrictions;
		const positionCubeRestriction =
			orbitRestriction.position && orbitRestriction.position.cube
				? {
						min: {
							x: orbitRestriction.position.cube.min.x,
							y: orbitRestriction.position.cube.min.y,
							z: orbitRestriction.position.cube.min.z,
						},
						max: {
							x: orbitRestriction.position.cube.max.x,
							y: orbitRestriction.position.cube.max.y,
							z: orbitRestriction.position.cube.max.z,
						},
					}
				: {
						min: {x: -Infinity, y: -Infinity, z: -Infinity},
						max: {x: Infinity, y: Infinity, z: Infinity},
					};
		const targetCubeRestriction =
			orbitRestriction.target && orbitRestriction.target.cube
				? {
						min: {
							x: orbitRestriction.target.cube.min.x,
							y: orbitRestriction.target.cube.min.y,
							z: orbitRestriction.target.cube.min.z,
						},
						max: {
							x: orbitRestriction.target.cube.max.x,
							y: orbitRestriction.target.cube.max.y,
							z: orbitRestriction.target.cube.max.z,
						},
					}
				: {
						min: {x: -Infinity, y: -Infinity, z: -Infinity},
						max: {x: Infinity, y: Infinity, z: Infinity},
					};
		const positionSphereRestriction =
			orbitRestriction.position && orbitRestriction.position.sphere
				? {
						center: {
							x: orbitRestriction.position.sphere.center.x,
							y: orbitRestriction.position.sphere.center.y,
							z: orbitRestriction.position.sphere.center.z,
						},
						radius: orbitRestriction.position.sphere.radius,
					}
				: {center: {x: 0, y: 0, z: 0}, radius: Infinity};
		const targetSphereRestriction =
			orbitRestriction.target && orbitRestriction.target.sphere
				? {
						center: {
							x: orbitRestriction.target.sphere.center.x,
							y: orbitRestriction.target.sphere.center.y,
							z: orbitRestriction.target.sphere.center.z,
						},
						radius: orbitRestriction.target.sphere.radius,
					}
				: {center: {x: 0, y: 0, z: 0}, radius: Infinity};
		const rotationRestriction = orbitRestriction.rotation
			? {
					minPolarAngle: orbitRestriction.rotation.minPolarAngle,
					maxPolarAngle: orbitRestriction.rotation.maxPolarAngle,
					minAzimuthAngle: orbitRestriction.rotation.minAzimuthAngle,
					maxAzimuthAngle: orbitRestriction.rotation.maxAzimuthAngle,
				}
			: {
					minPolarAngle: 0,
					maxPolarAngle: 180,
					minAzimuthAngle: -Infinity,
					maxAzimuthAngle: Infinity,
				};
		const zoomRestriction = orbitRestriction.zoom
			? {
					minDistance: orbitRestriction.zoom.minDistance,
					maxDistance: orbitRestriction.zoom.maxDistance,
				}
			: {minDistance: 0, maxDistance: Infinity};
		const restrictions = {
			position: {
				cube: positionCubeRestriction,
				sphere: positionSphereRestriction,
			},
			target: {
				cube: targetCubeRestriction,
				sphere: targetSphereRestriction,
			},
			rotation: rotationRestriction,
			zoom: zoomRestriction,
		};

		settings.camera.cameras = {
			[id]: {
				type: "perspective",
				autoAdjust: oldSettings.viewer.scene.camera.autoAdjust,
				cameraMovementDuration:
					oldSettings.viewer.scene.camera.cameraMovementDuration,
				controls: {
					autoRotationSpeed:
						oldSettings.viewer.scene.camera.controls.orbit
							.autoRotationSpeed,
					damping:
						oldSettings.viewer.scene.camera.controls.orbit.damping,
					enableAutoRotation:
						oldSettings.viewer.scene.camera.controls.orbit
							.enableAutoRotation,
					enableKeyPan:
						oldSettings.viewer.scene.camera.controls.orbit
							.enableKeyPan,
					enablePan:
						oldSettings.viewer.scene.camera.controls.orbit
							.enablePan,
					enableRotation:
						oldSettings.viewer.scene.camera.controls.orbit
							.enableRotation,
					enableZoom:
						oldSettings.viewer.scene.camera.controls.orbit
							.enableZoom,
					input: {
						keys: {
							up: oldSettings.viewer.scene.camera.controls.orbit
								.input.keys.up,
							down: oldSettings.viewer.scene.camera.controls.orbit
								.input.keys.down,
							left: oldSettings.viewer.scene.camera.controls.orbit
								.input.keys.left,
							right: oldSettings.viewer.scene.camera.controls
								.orbit.input.keys.right,
						},
						mouse: {
							rotate: oldSettings.viewer.scene.camera.controls
								.orbit.input.mouse.rotate,
							zoom: oldSettings.viewer.scene.camera.controls.orbit
								.input.mouse.zoom,
							pan: oldSettings.viewer.scene.camera.controls.orbit
								.input.mouse.pan,
						},
						touch: {
							rotate: oldSettings.viewer.scene.camera.controls
								.orbit.input.touch.rotate,
							zoom: oldSettings.viewer.scene.camera.controls.orbit
								.input.touch.zoom,
							pan: oldSettings.viewer.scene.camera.controls.orbit
								.input.touch.pan,
						},
					},
					keyPanSpeed:
						oldSettings.viewer.scene.camera.controls.orbit
							.keyPanSpeed,
					movementSmoothness:
						oldSettings.viewer.scene.camera.controls.orbit
							.movementSmoothness,
					restrictions,
					rotationSpeed:
						oldSettings.viewer.scene.camera.controls.orbit
							.rotationSpeed,
					panSpeed:
						oldSettings.viewer.scene.camera.controls.orbit.panSpeed,
					zoomSpeed:
						oldSettings.viewer.scene.camera.controls.orbit
							.zoomSpeed,
				},
				enableCameraControls:
					oldSettings.viewer.scene.camera.enableCameraControls,
				fov: oldSettings.viewer.scene.camera.cameraTypes.perspective
					.fov,
				position: {
					x: oldSettings.viewer.scene.camera.cameraTypes.perspective
						.default.position.x,
					y: oldSettings.viewer.scene.camera.cameraTypes.perspective
						.default.position.y,
					z: oldSettings.viewer.scene.camera.cameraTypes.perspective
						.default.position.z,
				},
				revertAtMouseUp:
					oldSettings.viewer.scene.camera.revertAtMouseUp,
				revertAtMouseUpDuration:
					oldSettings.viewer.scene.camera.revertAtMouseUpDuration,
				target: {
					x: oldSettings.viewer.scene.camera.cameraTypes.perspective
						.default.target.x,
					y: oldSettings.viewer.scene.camera.cameraTypes.perspective
						.default.target.y,
					z: oldSettings.viewer.scene.camera.cameraTypes.perspective
						.default.target.z,
				},
				zoomExtentsFactor:
					oldSettings.viewer.scene.camera.zoomExtentsFactor,
			},
		};
	} else {
		let type = "top";
		switch (oldSettings.viewer.scene.camera.cameraTypes.active) {
			case 2:
				type = "bottom";
				break;
			case 3:
				type = "right";
				break;
			case 4:
				type = "left";
				break;
			case 5:
				type = "back";
				break;
			case 6:
				type = "front";
				break;
			default:
				type = "top";
		}
		settings.camera.cameras = {
			[id]: {
				type,
				autoAdjust: oldSettings.viewer.scene.camera.autoAdjust,
				cameraMovementDuration:
					oldSettings.viewer.scene.camera.cameraMovementDuration,
				controls: {
					damping:
						oldSettings.viewer.scene.camera.controls.orbit.damping,
					enableKeyPan:
						oldSettings.viewer.scene.camera.controls.orbit
							.enableKeyPan,
					enablePan:
						oldSettings.viewer.scene.camera.controls.orbit
							.enablePan,
					enableZoom:
						oldSettings.viewer.scene.camera.controls.orbit
							.enableZoom,
					input: {
						keys: {
							up: oldSettings.viewer.scene.camera.controls.orbit
								.input.keys.up,
							down: oldSettings.viewer.scene.camera.controls.orbit
								.input.keys.down,
							left: oldSettings.viewer.scene.camera.controls.orbit
								.input.keys.left,
							right: oldSettings.viewer.scene.camera.controls
								.orbit.input.keys.right,
						},
						mouse: {
							rotate: oldSettings.viewer.scene.camera.controls
								.orbit.input.mouse.rotate,
							zoom: oldSettings.viewer.scene.camera.controls.orbit
								.input.mouse.zoom,
							pan: oldSettings.viewer.scene.camera.controls.orbit
								.input.mouse.pan,
						},
						touch: {
							rotate: oldSettings.viewer.scene.camera.controls
								.orbit.input.touch.rotate,
							zoom: oldSettings.viewer.scene.camera.controls.orbit
								.input.touch.zoom,
							pan: oldSettings.viewer.scene.camera.controls.orbit
								.input.touch.pan,
						},
					},
					keyPanSpeed:
						oldSettings.viewer.scene.camera.controls.orbit
							.keyPanSpeed,
					movementSmoothness:
						oldSettings.viewer.scene.camera.controls.orbit
							.movementSmoothness,
					panSpeed:
						oldSettings.viewer.scene.camera.controls.orbit.panSpeed,
					zoomSpeed:
						oldSettings.viewer.scene.camera.controls.orbit
							.zoomSpeed,
				},
				enableCameraControls:
					oldSettings.viewer.scene.camera.enableCameraControls,
				position: {
					x: oldSettings.viewer.scene.camera.cameraTypes.orthographic
						.default.position.x,
					y: oldSettings.viewer.scene.camera.cameraTypes.orthographic
						.default.position.y,
					z: oldSettings.viewer.scene.camera.cameraTypes.orthographic
						.default.position.z,
				},
				revertAtMouseUp:
					oldSettings.viewer.scene.camera.revertAtMouseUp,
				revertAtMouseUpDuration:
					oldSettings.viewer.scene.camera.revertAtMouseUpDuration,
				target: {
					x: oldSettings.viewer.scene.camera.cameraTypes.orthographic
						.default.target.x,
					y: oldSettings.viewer.scene.camera.cameraTypes.orthographic
						.default.target.y,
					z: oldSettings.viewer.scene.camera.cameraTypes.orthographic
						.default.target.z,
				},
				zoomExtentsFactor:
					oldSettings.viewer.scene.camera.zoomExtentsFactor,
			},
		};
	}

	settings.environment.map = oldSettings.viewer.scene.material.environmentMap;
	settings.environment.mapAsBackground =
		oldSettings.viewer.scene.material.environmentMapAsBackground;
	settings.environment.mapResolution =
		oldSettings.viewer.scene.material.environmentMapResolution;

	oldSettings.viewer.scene.lights;
	settings.light.lightSceneId = oldSettings.viewer.scene.lights.lightScene;
	if (oldSettings.viewer.scene.lights.lightScenes) {
		for (let id in oldSettings.viewer.scene.lights.lightScenes) {
			const oldLs = oldSettings.viewer.scene.lights.lightScenes[id];

			const lights: {
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
			} = {};

			for (let lightId in oldLs.lights) {
				const l =
					oldSettings.viewer.scene.lights.lightScenes[id].lights[
						lightId
					];

				switch (l.type) {
					case "ambient":
						lights[lightId] = {
							name: l.name,
							type: l.type,
							properties: {
								color: (<IAmbientLightProperties>l.properties)
									.color,
								intensity: l.properties.intensity,
							},
						};
						break;
					case "directional":
						lights[lightId] = {
							name: l.name,
							type: l.type,
							properties: {
								direction: {
									x: (<IDirectionalLightProperties>(
										l.properties
									)).direction.x,
									y: (<IDirectionalLightProperties>(
										l.properties
									)).direction.y,
									z: (<IDirectionalLightProperties>(
										l.properties
									)).direction.z,
								},
								color: (<IDirectionalLightProperties>(
									l.properties
								)).color,
								intensity: l.properties.intensity,
								castShadow: (<IDirectionalLightProperties>(
									l.properties
								)).castShadow,
								shadowMapResolution: (<
									IDirectionalLightProperties
								>l.properties).shadowMapResolution,
								shadowMapBias: (<IDirectionalLightProperties>(
									l.properties
								)).shadowMapBias,
							},
						};
						break;
					case "hemisphere":
						lights[lightId] = {
							name: l.name,
							type: l.type,
							properties: {
								skyColor: (<IHemisphereLightProperties>(
									l.properties
								)).skyColor,
								intensity: l.properties.intensity,
								groundColor: (<IHemisphereLightProperties>(
									l.properties
								)).groundColor,
							},
						};
						break;
					case "point":
						lights[lightId] = {
							name: l.name,
							type: l.type,
							properties: {
								color: (<IPointLightProperties>l.properties)
									.color,
								intensity: l.properties.intensity,
								position: {
									x: (<IPointLightProperties>l.properties)
										.position.x,
									y: (<IPointLightProperties>l.properties)
										.position.y,
									z: (<IPointLightProperties>l.properties)
										.position.z,
								},
								distance: (<IPointLightProperties>l.properties)
									.distance,
								decay: (<IPointLightProperties>l.properties)
									.decay,
							},
						};
						break;
					case "spot":
						lights[lightId] = {
							name: l.name,
							type: l.type,
							properties: {
								color: (<ISpotLightProperties>l.properties)
									.color,
								intensity: l.properties.intensity,
								position: {
									x: (<ISpotLightProperties>l.properties)
										.position.x,
									y: (<ISpotLightProperties>l.properties)
										.position.y,
									z: (<ISpotLightProperties>l.properties)
										.position.z,
								},
								target: {
									x: (<ISpotLightProperties>l.properties)
										.target.x,
									y: (<ISpotLightProperties>l.properties)
										.target.y,
									z: (<ISpotLightProperties>l.properties)
										.target.z,
								},
								distance: (<ISpotLightProperties>l.properties)
									.distance,
								decay: (<ISpotLightProperties>l.properties)
									.decay,
								angle: (<ISpotLightProperties>l.properties)
									.angle,
								penumbra: (<ISpotLightProperties>l.properties)
									.penumbra,
							},
						};
						break;
				}

				if (l.order) lights[lightId].order = l.order;
			}

			settings.light.lightScenes[id] = {
				name: oldLs.name,
				lights,
			};
		}
	}

	settings.rendering.ambientOcclusion =
		oldSettings.viewer.scene.render.ambientOcclusion;
	if (
		oldSettings.viewer.scene.render.beautyRenderBlendingDuration !==
		undefined
	)
		settings.rendering.beautyRenderBlendingDuration =
			oldSettings.viewer.scene.render.beautyRenderBlendingDuration;
	settings.rendering.beautyRenderDelay =
		oldSettings.viewer.scene.render.beautyRenderDelay;
	settings.environment.clearAlpha =
		oldSettings.viewer.scene.render.clearAlpha;
	settings.environment.clearColor =
		oldSettings.viewer.scene.render.clearColor;
	settings.general.pointSize = oldSettings.viewer.scene.render.pointSize;
	settings.rendering.shadows = oldSettings.viewer.scene.render.shadows;

	return settings;
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const settings = DefaultsV2();
	const newSettings = <ISettingsV3>s;
	settings.build_date = newSettings.build_date;
	settings.build_version = newSettings.build_version;

	if (newSettings.camera.cameras[newSettings.camera.cameraId]) {
		const camera = newSettings.camera.cameras[newSettings.camera.cameraId];
		switch (camera.type) {
			case "top":
				settings.viewer.scene.camera.cameraTypes.active = 1;
				break;
			case "bottom":
				settings.viewer.scene.camera.cameraTypes.active = 2;
				break;
			case "right":
				settings.viewer.scene.camera.cameraTypes.active = 3;
				break;
			case "left":
				settings.viewer.scene.camera.cameraTypes.active = 4;
				break;
			case "back":
				settings.viewer.scene.camera.cameraTypes.active = 5;
				break;
			case "front":
				settings.viewer.scene.camera.cameraTypes.active = 6;
				break;
			default:
				settings.viewer.scene.camera.cameraTypes.active = 0;
		}
		settings.viewer.scene.camera.autoAdjust = camera.autoAdjust;
		settings.viewer.scene.camera.cameraMovementDuration =
			camera.cameraMovementDuration;
		settings.viewer.scene.camera.enableCameraControls =
			camera.enableCameraControls;
		settings.viewer.scene.camera.revertAtMouseUp = camera.revertAtMouseUp;
		settings.viewer.scene.camera.revertAtMouseUpDuration =
			camera.revertAtMouseUpDuration;
		settings.viewer.scene.camera.zoomExtentsFactor =
			camera.zoomExtentsFactor;

		if (camera.type === "perspective") {
			const pc = <IPerspectiveCameraSettings>camera;
			settings.viewer.scene.camera.cameraTypes.perspective.default.position =
				{
					x: camera.position.x,
					y: camera.position.y,
					z: camera.position.z,
				};
			settings.viewer.scene.camera.cameraTypes.perspective.default.target =
				{x: camera.target.x, y: camera.target.y, z: camera.target.z};
			settings.viewer.scene.camera.cameraTypes.perspective.fov = pc.fov;

			settings.viewer.scene.camera.controls.orbit = {
				autoRotationSpeed: pc.controls.autoRotationSpeed,
				damping: pc.controls.damping,
				enableAutoRotation: pc.controls.enableAutoRotation,
				enableKeyPan: pc.controls.enableKeyPan,
				enablePan: pc.controls.enablePan,
				enableRotation: pc.controls.enableRotation,
				enableZoom: pc.controls.enableZoom,
				input: {
					keys: {
						up: pc.controls.input.keys.up,
						down: pc.controls.input.keys.down,
						left: pc.controls.input.keys.left,
						right: pc.controls.input.keys.right,
					},
					mouse: {
						rotate: pc.controls.input.mouse.rotate,
						zoom: pc.controls.input.mouse.zoom,
						pan: pc.controls.input.mouse.pan,
					},
					touch: {
						rotate: pc.controls.input.touch.rotate,
						zoom: pc.controls.input.touch.zoom,
						pan: pc.controls.input.touch.pan,
					},
				},
				keyPanSpeed: pc.controls.keyPanSpeed,
				movementSmoothness: pc.controls.movementSmoothness,
				restrictions: {
					position: {
						cube: {
							min: {
								x: pc.controls.restrictions.position.cube.min.x,
								y: pc.controls.restrictions.position.cube.min.y,
								z: pc.controls.restrictions.position.cube.min.z,
							},
							max: {
								x: pc.controls.restrictions.position.cube.max.x,
								y: pc.controls.restrictions.position.cube.max.y,
								z: pc.controls.restrictions.position.cube.max.z,
							},
						},
						sphere: {
							center: {
								x: pc.controls.restrictions.position.sphere
									.center.x,
								y: pc.controls.restrictions.position.sphere
									.center.y,
								z: pc.controls.restrictions.position.sphere
									.center.z,
							},
							radius: pc.controls.restrictions.position.sphere
								.radius,
						},
					},
					target: {
						cube: {
							min: {
								x: pc.controls.restrictions.target.cube.min.x,
								y: pc.controls.restrictions.target.cube.min.y,
								z: pc.controls.restrictions.target.cube.min.z,
							},
							max: {
								x: pc.controls.restrictions.target.cube.max.x,
								y: pc.controls.restrictions.target.cube.max.y,
								z: pc.controls.restrictions.target.cube.max.z,
							},
						},
						sphere: {
							center: {
								x: pc.controls.restrictions.target.sphere.center
									.x,
								y: pc.controls.restrictions.target.sphere.center
									.y,
								z: pc.controls.restrictions.target.sphere.center
									.z,
							},
							radius: pc.controls.restrictions.target.sphere
								.radius,
						},
					},
					rotation: {
						minPolarAngle:
							pc.controls.restrictions.rotation.minPolarAngle,
						maxPolarAngle:
							pc.controls.restrictions.rotation.maxPolarAngle,
						minAzimuthAngle:
							pc.controls.restrictions.rotation.minAzimuthAngle,
						maxAzimuthAngle:
							pc.controls.restrictions.rotation.maxAzimuthAngle,
					},
					zoom: {
						minDistance: pc.controls.restrictions.zoom.minDistance,
						maxDistance: pc.controls.restrictions.zoom.maxDistance,
					},
				},
				rotationSpeed: pc.controls.rotationSpeed,
				panSpeed: pc.controls.panSpeed,
				zoomSpeed: pc.controls.zoomSpeed,
			};
		} else {
			const oc = <IOrthographicCameraSettings>camera;
			settings.viewer.scene.camera.cameraTypes.orthographic.default.position =
				{
					x: camera.position.x,
					y: camera.position.y,
					z: camera.position.z,
				};
			settings.viewer.scene.camera.cameraTypes.orthographic.default.target =
				{x: camera.target.x, y: camera.target.y, z: camera.target.z};

			settings.viewer.scene.camera.controls.orthographic = {
				damping: oc.controls.damping,
				enableKeyPan: oc.controls.enableKeyPan,
				enablePan: oc.controls.enablePan,
				enableZoom: oc.controls.enableZoom,
				input: {
					keys: {
						up: oc.controls.input.keys.up,
						down: oc.controls.input.keys.down,
						left: oc.controls.input.keys.left,
						right: oc.controls.input.keys.right,
					},
					mouse: {
						rotate: oc.controls.input.mouse.rotate,
						zoom: oc.controls.input.mouse.zoom,
						pan: oc.controls.input.mouse.pan,
					},
					touch: {
						rotate: oc.controls.input.touch.rotate,
						zoom: oc.controls.input.touch.zoom,
						pan: oc.controls.input.touch.pan,
					},
				},
				keyPanSpeed: oc.controls.keyPanSpeed,
				movementSmoothness: oc.controls.movementSmoothness,
				panSpeed: oc.controls.panSpeed,
				zoomSpeed: oc.controls.zoomSpeed,
			};
		}
	}

	settings.viewer.scene.render.clearAlpha =
		newSettings.environment.clearAlpha;
	settings.viewer.scene.render.clearColor =
		newSettings.environment.clearColor;
	settings.viewer.scene.material.environmentMap = newSettings.environment.map;
	settings.viewer.scene.material.environmentMapAsBackground =
		newSettings.environment.mapAsBackground;
	settings.viewer.scene.material.environmentMapResolution =
		newSettings.environment.mapResolution;

	settings.viewer.scene.gridVisibility =
		newSettings.environmentGeometry.gridVisibility;
	settings.viewer.scene.groundPlaneVisibility =
		newSettings.environmentGeometry.groundPlaneVisibility;

	settings.viewer.blurSceneWhenBusy = newSettings.general.blurWhenBusy;
	settings.viewer.commitParameters = newSettings.general.commitParameters;
	settings.viewer.commitSettings = newSettings.general.commitSettings;
	settings.viewer.scene.render.pointSize = newSettings.general.pointSize;
	settings.viewer.showMessages = newSettings.general.showMessages;

	settings.viewer.scene.lights.lightScene =
		newSettings.light.lightSceneId || "default";

	for (let lightSceneId in newSettings.light.lightScenes) {
		const ls = newSettings.light.lightScenes[lightSceneId];

		const lights: {
			[key: string]: {
				id: string;
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
		} = {};
		for (let lightId in ls.lights) {
			const l = ls.lights[lightId];

			switch (l.type) {
				case "ambient":
					lights[lightId] = {
						id: lightId,
						name: l.name,
						type: l.type,
						order: l.order,
						properties: {
							color: (<IAmbientLightProperties>l.properties)
								.color,
							intensity: l.properties.intensity,
						},
					};
					break;
				case "directional":
					lights[lightId] = {
						id: lightId,
						name: l.name,
						type: l.type,
						order: l.order,
						properties: {
							direction: {
								x: (<IDirectionalLightProperties>l.properties)
									.direction.x,
								y: (<IDirectionalLightProperties>l.properties)
									.direction.y,
								z: (<IDirectionalLightProperties>l.properties)
									.direction.z,
							},
							color: (<IDirectionalLightProperties>l.properties)
								.color,
							intensity: l.properties.intensity,
							castShadow: (<IDirectionalLightProperties>(
								l.properties
							)).castShadow,
							shadowMapResolution: (<IDirectionalLightProperties>(
								l.properties
							)).shadowMapResolution,
							shadowMapBias: (<IDirectionalLightProperties>(
								l.properties
							)).shadowMapBias,
						},
					};
					break;
				case "hemisphere":
					lights[lightId] = {
						id: lightId,
						name: l.name,
						type: l.type,
						order: l.order,
						properties: {
							skyColor: (<IHemisphereLightProperties>l.properties)
								.skyColor,
							intensity: l.properties.intensity,
							groundColor: (<IHemisphereLightProperties>(
								l.properties
							)).groundColor,
						},
					};
					break;
				case "point":
					lights[lightId] = {
						id: lightId,
						name: l.name,
						type: l.type,
						order: l.order,
						properties: {
							color: (<IPointLightProperties>l.properties).color,
							intensity: l.properties.intensity,
							position: {
								x: (<IPointLightProperties>l.properties)
									.position.x,
								y: (<IPointLightProperties>l.properties)
									.position.y,
								z: (<IPointLightProperties>l.properties)
									.position.z,
							},
							distance: (<IPointLightProperties>l.properties)
								.distance,
							decay: (<IPointLightProperties>l.properties).decay,
						},
					};
					break;
				case "spot":
					lights[lightId] = {
						id: lightId,
						name: l.name,
						type: l.type,
						order: l.order,
						properties: {
							color: (<ISpotLightProperties>l.properties).color,
							intensity: l.properties.intensity,
							position: {
								x: (<ISpotLightProperties>l.properties).position
									.x,
								y: (<ISpotLightProperties>l.properties).position
									.y,
								z: (<ISpotLightProperties>l.properties).position
									.z,
							},
							target: {
								x: (<ISpotLightProperties>l.properties).target
									.x,
								y: (<ISpotLightProperties>l.properties).target
									.y,
								z: (<ISpotLightProperties>l.properties).target
									.z,
							},
							distance: (<ISpotLightProperties>l.properties)
								.distance,
							decay: (<ISpotLightProperties>l.properties).decay,
							angle: (<ISpotLightProperties>l.properties).angle,
							penumbra: (<ISpotLightProperties>l.properties)
								.penumbra,
						},
					};
					break;
			}
		}
		settings.viewer.scene.lights.lightScenes[lightSceneId] = {
			id: lightSceneId,
			name: ls.name,
			lights,
		};
	}

	settings.viewer.scene.render.ambientOcclusion =
		newSettings.rendering.ambientOcclusion;
	settings.viewer.scene.render.beautyRenderBlendingDuration =
		newSettings.rendering.beautyRenderBlendingDuration;
	settings.viewer.scene.render.beautyRenderDelay =
		newSettings.rendering.beautyRenderDelay;
	settings.viewer.scene.render.shadows = newSettings.rendering.shadows;

	let ordered: {id: string; order: number}[] = [];
	for (let id in newSettings.session) {
		if (newSettings.session[id].displayname)
			settings.parameters!.controlNames![id] =
				newSettings.session[id].displayname!;
		if (newSettings.session[id].hidden)
			settings.parameters!.parametersHidden!.push(id);
		ordered.push({
			id,
			order: newSettings.session[id].order || 0,
		});
	}

	ordered.sort((a, b) => (a.order || Infinity) - (b.order || Infinity));
	let zeros = ordered.filter((x) => x.order === 0);
	ordered = ordered.filter((el) => {
		return !zeros.includes(el);
	});
	ordered = zeros.concat(ordered);
	settings.parameters!.controlOrder = ordered.map((value) => {
		return value.id;
	});

	return settings;
};
