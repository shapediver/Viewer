import {
	CAMERA_TYPE,
	ICameraOptions,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
	OrthographicCameraProperties,
	PerspectiveCameraProperties,
} from "@shapediver/viewer.shared.types";
import {AbstractCamera} from "./implementation/camera/AbstractCamera";
import {OrthographicCamera} from "./implementation/camera/OrthographicCamera";
import {PerspectiveCamera} from "./implementation/camera/PerspectiveCamera";
import {CameraEngine} from "./implementation/CameraEngine";
import {OrthographicCameraControls} from "./implementation/controls/OrthographicCameraControls";
import {PerspectiveCameraControls} from "./implementation/controls/PerspectiveCameraControls";
import {ICamera} from "./interfaces/camera/ICamera";
import {IOrthographicCamera} from "./interfaces/camera/IOrthographicCamera";
import {IPerspectiveCamera} from "./interfaces/camera/IPerspectiveCamera";
import {ICameraControls} from "./interfaces/controls/ICameraControls";
import {ICameraEngine} from "./interfaces/ICameraEngine";

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
