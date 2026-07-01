import {
	CAMERA_TYPE,
	type ICameraOptions,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
	type OrthographicCameraProperties,
	type PerspectiveCameraProperties} from "@shapediver/viewer.shared.types";
import {AbstractCamera} from "./implementation/camera/AbstractCamera";
import {OrthographicCamera} from "./implementation/camera/OrthographicCamera";
import {PerspectiveCamera} from "./implementation/camera/PerspectiveCamera";
import {CameraEngine} from "./implementation/CameraEngine";
import {OrthographicCameraControls} from "./implementation/controls/OrthographicCameraControls";
import {PerspectiveCameraControls} from "./implementation/controls/PerspectiveCameraControls";
import {type ICamera} from "./interfaces/camera/ICamera";
import {type IOrthographicCamera} from "./interfaces/camera/IOrthographicCamera";
import {type IPerspectiveCamera} from "./interfaces/camera/IPerspectiveCamera";
import {type ICameraControls} from "./interfaces/controls/ICameraControls";
import {type ICameraEngine} from "./interfaces/ICameraEngine";

export {
	AbstractCamera,
	CAMERA_TYPE,
	CameraEngine,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
	OrthographicCamera,
	OrthographicCameraControls,
	PerspectiveCamera,
	PerspectiveCameraControls,
};
export type {
	ICamera,
	ICameraControls,
	ICameraEngine,
	ICameraOptions,
	IOrthographicCamera,
	IPerspectiveCamera,
	OrthographicCameraProperties,
	PerspectiveCameraProperties,
};
