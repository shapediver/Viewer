import { ISettings as ISettingsV4_1 } from "../v4_1/ISettings"
import { ISettings as ISettingsV5 } from "./ISettings"
import { Defaults as DefaultsV4_1 } from "../v4_1/Defaults";
import { Defaults as DefaultsV5 } from "./Defaults";
import { IGlobalSettings } from "../../interfaces/IGlobalSettings";
import { versions } from "../..";
import { IPerspectiveCameraSettings } from "../v3/ICameraSettings";

export const convertFromPrevious = (s: IGlobalSettings, v: versions): IGlobalSettings => {
    const settings = DefaultsV5();
    const oldSettings = <ISettingsV4_1>s;

    /**
     * SETTINGS OBJECTS THAT DID NOT CHANGE
     */

    settings.ar = oldSettings.ar;
    settings.build_date = oldSettings.build_date;
    settings.build_version = oldSettings.build_version;
    settings.general = oldSettings.general;
    settings.light = oldSettings.light;
    settings.session = oldSettings.session;
    settings.environment = oldSettings.environment;
    settings.environmentGeometry = oldSettings.environmentGeometry;
    settings.rendering = oldSettings.rendering;
    settings.postprocessing = oldSettings.postprocessing;

    /**
     * SETTINGS OBJECTS THAT DID CHANGE
     */
    settings.camera.cameraId = oldSettings.camera.cameraId;
    for (const key in oldSettings.camera.cameras) {
        if (oldSettings.camera.cameras[key].type === "perspective") {
            const perspectiveCamera = oldSettings.camera.cameras[key] as IPerspectiveCameraSettings;

            settings.camera.cameras[key] = {
                autoAdjust: perspectiveCamera.autoAdjust,
                cameraMovementDuration: perspectiveCamera.cameraMovementDuration,
                controls: {
                    autoRotationSpeed: perspectiveCamera.controls.autoRotationSpeed,
                    damping: perspectiveCamera.controls.damping,
                    enableAutoRotation: perspectiveCamera.controls.enableAutoRotation,
                    enableKeyPan: perspectiveCamera.controls.enableKeyPan,
                    enablePan: perspectiveCamera.controls.enablePan,
                    enableRotation: perspectiveCamera.controls.enableRotation,
                    enableZoom: perspectiveCamera.controls.enableZoom,
                    input: perspectiveCamera.controls.input,
                    keyPanSpeed: perspectiveCamera.controls.keyPanSpeed,
                    movementSmoothness: perspectiveCamera.controls.movementSmoothness,
                    restrictions: perspectiveCamera.controls.restrictions,
                    rotationSpeed: perspectiveCamera.controls.rotationSpeed,
                    panSpeed: perspectiveCamera.controls.panSpeed,
                    zoomSpeed: perspectiveCamera.controls.zoomSpeed,
                    enableAzimuthRotation: true,
                    enableObjectControls: false,
                    enablePolarRotation: true,
                    enableTurntableControls: false,
                    objectControlsCenter: { x: 0, y: 0, z: 0 },
                    turntableCenter: { x: 0, y: 0, z: 0 },
                },
                enableCameraControls: perspectiveCamera.enableCameraControls,
                fov: perspectiveCamera.fov,
                name: perspectiveCamera.name,
                position: perspectiveCamera.position,
                revertAtMouseUp: perspectiveCamera.revertAtMouseUp,
                revertAtMouseUpDuration: perspectiveCamera.revertAtMouseUpDuration,
                sceneRotation: { x: 0, y: 0 }, // This property did not exist in the previous version
                target: perspectiveCamera.target,
                type: perspectiveCamera.type,
                zoomExtentsFactor: perspectiveCamera.zoomExtentsFactor
            }
        } else {
            const orthographicCamera = oldSettings.camera.cameras[key] as IPerspectiveCameraSettings;

            settings.camera.cameras[key] = {
                autoAdjust: orthographicCamera.autoAdjust,
                cameraMovementDuration: orthographicCamera.cameraMovementDuration,
                controls: {
                    damping: orthographicCamera.controls.damping,
                    enableKeyPan: orthographicCamera.controls.enableKeyPan,
                    enablePan: orthographicCamera.controls.enablePan,
                    enableZoom: orthographicCamera.controls.enableZoom,
                    input: orthographicCamera.controls.input,
                    keyPanSpeed: orthographicCamera.controls.keyPanSpeed,
                    movementSmoothness: orthographicCamera.controls.movementSmoothness,
                    panSpeed: orthographicCamera.controls.panSpeed,
                    zoomSpeed: orthographicCamera.controls.zoomSpeed,
                    autoRotationSpeed: 0,
                    enableAutoRotation: false,
                    enableAzimuthRotation: true,
                    enableObjectControls: false,
                    enablePolarRotation: true,
                    enableRotation: true,
                    enableTurntableControls: false,
                    objectControlsCenter: { x: 0, y: 0, z: 0 },
                    restrictions: {
                        position: {
                            cube: { min: { x: -Infinity, y: -Infinity, z: -Infinity }, max: { x: Infinity, y: Infinity, z: Infinity } },
                            sphere: { center: { x: 0, y: 0, z: 0 }, radius: Infinity },
                        },
                        rotation: { minPolarAngle: 0, maxPolarAngle: 180, minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity },
                        target: {
                            cube: { min: { x: -Infinity, y: -Infinity, z: -Infinity }, max: { x: Infinity, y: Infinity, z: Infinity } },
                            sphere: { center: { x: 0, y: 0, z: 0 }, radius: Infinity },
                        },
                        zoom: { minDistance: 0, maxDistance: Infinity },
                    },
                    rotationSpeed: 0,
                    turntableCenter: { x: 0, y: 0, z: 0 },
                },
                enableCameraControls: orthographicCamera.enableCameraControls,
                fov: orthographicCamera.fov,
                name: orthographicCamera.name,
                position: orthographicCamera.position,
                revertAtMouseUp: orthographicCamera.revertAtMouseUp,
                revertAtMouseUpDuration: orthographicCamera.revertAtMouseUpDuration,
                sceneRotation: { x: 0, y: 0 }, // This property did not exist in the previous version
                target: orthographicCamera.target,
                type: orthographicCamera.type,
                zoomExtentsFactor: orthographicCamera.zoomExtentsFactor
            }
        }
    }

    return <ISettingsV5>settings;
}

export const convertToPrevious = (s: IGlobalSettings, v: versions): IGlobalSettings => {
    const settings = DefaultsV4_1();
    const newSettings = <ISettingsV5>s;

    /**
     * SETTINGS OBJECTS THAT DID NOT CHANGE
     */

    settings.ar = newSettings.ar;
    settings.build_date = newSettings.build_date;
    settings.build_version = newSettings.build_version;
    settings.general = newSettings.general;
    settings.light = newSettings.light;
    settings.rendering = newSettings.rendering;
    settings.session = newSettings.session;
    settings.environment = newSettings.environment;
    settings.environmentGeometry = newSettings.environmentGeometry;
    settings.postprocessing = newSettings.postprocessing;

    /**
     * SETTINGS OBJECTS THAT DID CHANGE
     */
    settings.camera.cameraId = newSettings.camera.cameraId;

    for (const key in newSettings.camera.cameras) {
        if (newSettings.camera.cameras[key].type === "perspective") {
            const perspectiveCamera = newSettings.camera.cameras[key] as IPerspectiveCameraSettings;

            settings.camera.cameras[key] = {
                autoAdjust: perspectiveCamera.autoAdjust,
                cameraMovementDuration: perspectiveCamera.cameraMovementDuration,
                controls: {
                    autoRotationSpeed: perspectiveCamera.controls.autoRotationSpeed,
                    damping: perspectiveCamera.controls.damping,
                    enableAutoRotation: perspectiveCamera.controls.enableAutoRotation,
                    enableKeyPan: perspectiveCamera.controls.enableKeyPan,
                    enablePan: perspectiveCamera.controls.enablePan,
                    enableRotation: perspectiveCamera.controls.enableRotation,
                    enableZoom: perspectiveCamera.controls.enableZoom,
                    input: perspectiveCamera.controls.input,
                    keyPanSpeed: perspectiveCamera.controls.keyPanSpeed,
                    movementSmoothness: perspectiveCamera.controls.movementSmoothness,
                    restrictions: perspectiveCamera.controls.restrictions,
                    rotationSpeed: perspectiveCamera.controls.rotationSpeed,
                    panSpeed: perspectiveCamera.controls.panSpeed,
                    zoomSpeed: perspectiveCamera.controls.zoomSpeed,
                },
                enableCameraControls: perspectiveCamera.enableCameraControls,
                fov: perspectiveCamera.fov,
                name: perspectiveCamera.name,
                position: perspectiveCamera.position,
                revertAtMouseUp: perspectiveCamera.revertAtMouseUp,
                revertAtMouseUpDuration: perspectiveCamera.revertAtMouseUpDuration,
                target: perspectiveCamera.target,
                type: perspectiveCamera.type,
                zoomExtentsFactor: perspectiveCamera.zoomExtentsFactor
            }
        } else {
            const orthographicCamera = newSettings.camera.cameras[key] as IPerspectiveCameraSettings;
            if (orthographicCamera.type === "custom") continue;

            settings.camera.cameras[key] = {
                autoAdjust: orthographicCamera.autoAdjust,
                cameraMovementDuration: orthographicCamera.cameraMovementDuration,
                controls: {
                    damping: orthographicCamera.controls.damping,
                    enableKeyPan: orthographicCamera.controls.enableKeyPan,
                    enablePan: orthographicCamera.controls.enablePan,
                    enableZoom: orthographicCamera.controls.enableZoom,
                    input: orthographicCamera.controls.input,
                    keyPanSpeed: orthographicCamera.controls.keyPanSpeed,
                    movementSmoothness: orthographicCamera.controls.movementSmoothness,
                    panSpeed: orthographicCamera.controls.panSpeed,
                    zoomSpeed: orthographicCamera.controls.zoomSpeed,
                },
                enableCameraControls: orthographicCamera.enableCameraControls,
                fov: orthographicCamera.fov,
                name: orthographicCamera.name,
                position: orthographicCamera.position,
                revertAtMouseUp: orthographicCamera.revertAtMouseUp,
                revertAtMouseUpDuration: orthographicCamera.revertAtMouseUpDuration,
                target: orthographicCamera.target,
                type: orthographicCamera.type,
                zoomExtentsFactor: orthographicCamera.zoomExtentsFactor
            }
        }
    }

    return <ISettingsV4_1>settings;
}