import { ISettings as ISettingsV1 } from "../v1/ISettings"
import { ISettings as ISettingsV2 } from "./ISettings"
import { Defaults as DefaultsV1 } from "../v1/Defaults";
import { Defaults as DefaultsV2 } from "./Defaults";
import { IGlobalSettings } from "../../interfaces/IGlobalSettings";
import { versions } from "../..";

export const convertFromPrevious = (s: IGlobalSettings, v: versions): IGlobalSettings => {
    const settings = DefaultsV2();
    const oldSettings = <ISettingsV1>s;

    if(oldSettings.clearAlpha !== undefined)
        settings.viewer.scene.render.clearAlpha = oldSettings.clearAlpha;
    if(oldSettings.clearColor !== undefined)
        settings.viewer.scene.render.clearColor = oldSettings.clearColor;

    if(oldSettings.clearAlpha === undefined && oldSettings.clearColor === undefined && oldSettings.backgroundColor !== undefined)
        settings.viewer.scene.render.clearColor = oldSettings.backgroundColor;

    if(oldSettings.defaultMaterialColor !== undefined)
        settings.defaultMaterial.color = oldSettings.defaultMaterialColor;

    settings.build_date = oldSettings.build_date;
    settings.build_version = oldSettings.build_version;

    if(oldSettings.camera !== undefined && oldSettings.camera.position !== undefined && oldSettings.camera.target !== undefined && 
        oldSettings.camera.position.x !== undefined && oldSettings.camera.position.y !== undefined && oldSettings.camera.position.z !== undefined && 
        oldSettings.camera.target.x !== undefined && oldSettings.camera.target.y !== undefined && oldSettings.camera.target.z !== undefined
        ) {
        if (!(oldSettings.camera.position.x === 5 && oldSettings.camera.position.y === 5 && oldSettings.camera.position.z === 5 &&
            oldSettings.camera.target.x === 0 && oldSettings.camera.target.y === 0 && oldSettings.camera.target.z === 0) &&
            !(oldSettings.camera.position.x === 0 && oldSettings.camera.position.y === 0 && oldSettings.camera.position.z === 0 &&
                oldSettings.camera.target.x === 0 && oldSettings.camera.target.y === 0 && oldSettings.camera.target.z === 0)) {
            settings.viewer.scene.camera.cameraTypes.perspective.default.position = <{x: number, y: number, z:number}>oldSettings.camera.position;
            settings.viewer.scene.camera.cameraTypes.perspective.default.target = <{x: number, y: number, z:number}>oldSettings.camera.target;
        }
    }

    if (oldSettings.cameraOrtho !== undefined && oldSettings.cameraOrtho.position !== undefined && oldSettings.cameraOrtho.target !== undefined &&
        oldSettings.cameraOrtho.position.x !== undefined && oldSettings.cameraOrtho.position.y !== undefined && oldSettings.cameraOrtho.position.z !== undefined &&
        oldSettings.cameraOrtho.target.x !== undefined && oldSettings.cameraOrtho.target.y !== undefined && oldSettings.cameraOrtho.target.z !== undefined
    ) {
        if (!(oldSettings.cameraOrtho.position.x === 5 && oldSettings.cameraOrtho.position.y === 5 && oldSettings.cameraOrtho.position.z === 5 &&
            oldSettings.cameraOrtho.target.x === 0 && oldSettings.cameraOrtho.target.y === 0 && oldSettings.cameraOrtho.target.z === 0) &&
            !(oldSettings.cameraOrtho.position.x === 0 && oldSettings.cameraOrtho.position.y === 0 && oldSettings.cameraOrtho.position.z === 0 &&
                oldSettings.cameraOrtho.target.x === 0 && oldSettings.cameraOrtho.target.y === 0 && oldSettings.cameraOrtho.target.z === 0)) {
            settings.viewer.scene.camera.cameraTypes.orthographic.default.position = <{ x: number, y: number, z: number }>oldSettings.cameraOrtho.position;
            settings.viewer.scene.camera.cameraTypes.orthographic.default.target = <{ x: number, y: number, z: number }>oldSettings.cameraOrtho.target;
        }
        else if (oldSettings.topView && !(oldSettings.cameraOrtho.position.x === 5 && oldSettings.cameraOrtho.position.y === 5 && oldSettings.cameraOrtho.position.z === 5 &&
            oldSettings.cameraOrtho.target.x === 0 && oldSettings.cameraOrtho.target.y === 0 && oldSettings.cameraOrtho.target.z === 0) &&
            !(oldSettings.cameraOrtho.position.x === 0 && oldSettings.cameraOrtho.position.y === 0 && oldSettings.cameraOrtho.position.z === 0 &&
                oldSettings.cameraOrtho.target.x === 0 && oldSettings.cameraOrtho.target.y === 0 && oldSettings.cameraOrtho.target.z === 0)) {
            if (oldSettings.camera !== undefined && oldSettings.camera.position !== undefined && oldSettings.camera.target !== undefined &&
                oldSettings.camera.position.x !== undefined && oldSettings.camera.position.y !== undefined && oldSettings.camera.position.z !== undefined &&
                oldSettings.camera.target.x !== undefined && oldSettings.camera.target.y !== undefined && oldSettings.camera.target.z !== undefined
            ) {
                settings.viewer.scene.camera.cameraTypes.orthographic.default.position = <{ x: number, y: number, z: number }>oldSettings.camera.position;
                settings.viewer.scene.camera.cameraTypes.orthographic.default.target = <{ x: number, y: number, z: number }>oldSettings.camera.target;
            }
        }
    }

    if(oldSettings.ambientOcclusion !== undefined) settings.viewer.scene.render.ambientOcclusion = oldSettings.ambientOcclusion;
    if(oldSettings.autoRotateSpeed !== undefined) settings.viewer.scene.camera.controls.orbit.autoRotationSpeed = oldSettings.autoRotateSpeed;
    if(oldSettings.bumpAmplitude !== undefined) settings.defaultMaterial.bumpAmplitude = oldSettings.bumpAmplitude;
    if(oldSettings.cameraAutoAdjust !== undefined) settings.viewer.scene.camera.autoAdjust = oldSettings.cameraAutoAdjust;
    if(oldSettings.cameraMovementDuration !== undefined) settings.viewer.scene.camera.cameraMovementDuration = oldSettings.cameraMovementDuration;
    if(oldSettings.cameraRevertAtMouseUp !== undefined) settings.viewer.scene.camera.revertAtMouseUp = oldSettings.cameraRevertAtMouseUp;
    if(oldSettings.commitParameters !== undefined) settings.viewer.commitParameters = oldSettings.commitParameters;
    if(oldSettings.controlDamping !== undefined) settings.viewer.scene.camera.controls.orbit.damping = oldSettings.controlDamping;
    if(oldSettings.controlDamping !== undefined) settings.viewer.scene.camera.controls.orthographic.damping = oldSettings.controlDamping;
    if(oldSettings.controlNames !== undefined) settings.parameters!.controlNames = oldSettings.controlNames;
    if(oldSettings.controlOrder !== undefined) settings.parameters!.controlOrder = oldSettings.controlOrder;
    if(oldSettings.disablePan !== undefined) settings.viewer.scene.camera.controls.orbit.enablePan = !oldSettings.disablePan;
    if(oldSettings.disablePan !== undefined) settings.viewer.scene.camera.controls.orthographic.enablePan = !oldSettings.disablePan;
    if(oldSettings.disableZoom !== undefined) settings.viewer.scene.camera.controls.orbit.enableZoom = !oldSettings.disableZoom;
    if(oldSettings.disableZoom !== undefined) settings.viewer.scene.camera.controls.orthographic.enableZoom = !oldSettings.disableZoom;
    if(oldSettings.enableAutoRotation !== undefined) settings.viewer.scene.camera.controls.orbit.enableAutoRotation = oldSettings.enableAutoRotation;
    if(oldSettings.enableRotation !== undefined) settings.viewer.scene.camera.controls.orbit.enableRotation = oldSettings.enableRotation;
    if(oldSettings.environmentMap !== undefined) settings.viewer.scene.material.environmentMap = oldSettings.environmentMap;
    if(oldSettings.environmentMapResolution !== undefined) settings.viewer.scene.material.environmentMapResolution = oldSettings.environmentMapResolution;
    if(oldSettings.fov !== undefined) settings.viewer.scene.camera.cameraTypes.perspective.fov = oldSettings.fov;
    if(oldSettings.lightScene !== undefined) settings.viewer.scene.lights.lightScene = oldSettings.lightScene;
    if(oldSettings.lightScenes !== undefined) settings.viewer.scene.lights.lightScenes = oldSettings.lightScenes;
    if(oldSettings.panSpeed !== undefined) settings.viewer.scene.camera.controls.orbit.panSpeed = oldSettings.panSpeed;
    if(oldSettings.parametersHidden !== undefined) settings.parameters!.parametersHidden = oldSettings.parametersHidden;
    if(oldSettings.pointSize !== undefined) settings.viewer.scene.render.pointSize = oldSettings.pointSize;
    if(oldSettings.revertAtMouseUpDuration !== undefined) settings.viewer.scene.camera.revertAtMouseUpDuration = oldSettings.revertAtMouseUpDuration;
    if(oldSettings.rotateSpeed !== undefined) settings.viewer.scene.camera.controls.orbit.rotationSpeed = oldSettings.rotateSpeed;
    if(oldSettings.showEnvironmentMap !== undefined) settings.viewer.scene.material.environmentMapAsBackground = oldSettings.showEnvironmentMap;
    if(oldSettings.showGrid !== undefined) settings.viewer.scene.gridVisibility = oldSettings.showGrid;
    if(oldSettings.showGroundPlane !== undefined) settings.viewer.scene.groundPlaneVisibility = oldSettings.showGroundPlane;
    if(oldSettings.showShadows !== undefined) settings.viewer.scene.render.shadows = oldSettings.showShadows;

    if (oldSettings.topView)
        settings.viewer.scene.camera.cameraTypes.active = 1;
    if(oldSettings.zoomExtentFactor !== undefined) settings.viewer.scene.camera.zoomExtentsFactor = oldSettings.zoomExtentFactor;
    if(oldSettings.zoomSpeed !== undefined) settings.viewer.scene.camera.controls.orbit.zoomSpeed = oldSettings.zoomSpeed;
    if(oldSettings.zoomSpeed !== undefined) settings.viewer.scene.camera.controls.orthographic.zoomSpeed = oldSettings.zoomSpeed;
    return settings;
}

export const convertToPrevious = (s: IGlobalSettings, v: versions): IGlobalSettings => {
    const settings = DefaultsV1();
    const newSettings = <ISettingsV2>s;
    settings.build_date = newSettings.build_date;
    settings.build_version = newSettings.build_version;

    settings.ambientOcclusion = newSettings.viewer.scene.render.ambientOcclusion;
    settings.autoRotateSpeed = newSettings.viewer.scene.camera.controls.orbit.autoRotationSpeed;
    settings.bumpAmplitude = newSettings.defaultMaterial.bumpAmplitude;
    settings.camera = {
        position: newSettings.viewer.scene.camera.cameraTypes.perspective.default.position,
        target: newSettings.viewer.scene.camera.cameraTypes.perspective.default.target,
    };
    settings.cameraAutoAdjust = newSettings.viewer.scene.camera.autoAdjust;
    settings.cameraMovementDuration = newSettings.viewer.scene.camera.cameraMovementDuration;
    settings.cameraOrtho = {
        position: newSettings.viewer.scene.camera.cameraTypes.orthographic.default.position,
        target: newSettings.viewer.scene.camera.cameraTypes.orthographic.default.target,
    };
    settings.cameraRevertAtMouseUp = newSettings.viewer.scene.camera.revertAtMouseUp;
    settings.clearAlpha = newSettings.viewer.scene.render.clearAlpha;
    settings.clearColor = newSettings.viewer.scene.render.clearColor;
    settings.commitParameters = newSettings.viewer.commitParameters;
    settings.controlDamping = newSettings.viewer.scene.camera.controls.orbit.damping;
    if (newSettings.parameters && newSettings.parameters.controlNames) { // important to keep this, because old viewers will not work properly if this property is null
        settings.controlNames = newSettings.parameters.controlNames;
    }
    if (newSettings.parameters && newSettings.parameters.controlOrder) { // important to keep this, because old viewers will not work properly if this property is null
        settings.controlOrder = newSettings.parameters.controlOrder;
    }
    settings.defaultMaterialColor = newSettings.defaultMaterial.color;
    settings.disablePan = !newSettings.viewer.scene.camera.controls.orbit.enablePan;
    settings.disableZoom = !newSettings.viewer.scene.camera.controls.orbit.enableZoom;
    settings.enableAutoRotation = newSettings.viewer.scene.camera.controls.orbit.enableAutoRotation;
    settings.enableRotation = newSettings.viewer.scene.camera.controls.orbit.enableRotation;
    settings.environmentMap = newSettings.viewer.scene.material.environmentMap;
    settings.environmentMapResolution = newSettings.viewer.scene.material.environmentMapResolution;
    settings.fov = newSettings.viewer.scene.camera.cameraTypes.perspective.fov;
    settings.lightScene = newSettings.viewer.scene.lights.lightScene;
    settings.lightScenes = newSettings.viewer.scene.lights.lightScenes;
    settings.panSpeed = newSettings.viewer.scene.camera.controls.orbit.panSpeed;
    if (newSettings.parameters && newSettings.parameters.parametersHidden) { // important to keep this, because old viewers will not work properly if this property is null
        settings.parametersHidden = newSettings.parameters.parametersHidden;
    }
    settings.pointSize = newSettings.viewer.scene.render.pointSize;
    settings.revertAtMouseUpDuration = newSettings.viewer.scene.camera.revertAtMouseUpDuration;
    settings.rotateSpeed = newSettings.viewer.scene.camera.controls.orbit.rotationSpeed;
    settings.showEnvironmentMap = newSettings.viewer.scene.material.environmentMapAsBackground;
    settings.showGrid = newSettings.viewer.scene.gridVisibility;
    settings.showGroundPlane = newSettings.viewer.scene.groundPlaneVisibility;
    settings.showShadows = newSettings.viewer.scene.render.shadows;

    settings.topView = newSettings.viewer.scene.camera.cameraTypes.active === 1;
    settings.zoomExtentFactor = newSettings.viewer.scene.camera.zoomExtentsFactor;
    settings.zoomSpeed = newSettings.viewer.scene.camera.controls.orbit.zoomSpeed;
    settings.backgroundColor = newSettings.viewer.scene.render.clearColor;

    return settings;
}