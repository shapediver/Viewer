import {
	CAMERA_TYPE,
	ICameraOptions,
	OrthographicCameraProperties,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
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

export {ICameraEngine, ICamera, ICameraControls};
export {
	CameraEngine,
	AbstractCamera,
	CAMERA_TYPE,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
	ICameraOptions,
};
export {
	PerspectiveCamera,
	OrthographicCamera,
	IPerspectiveCamera,
	IOrthographicCamera,
	OrthographicCameraProperties,
	PerspectiveCameraProperties,
};
export {PerspectiveCameraControls, OrthographicCameraControls};
