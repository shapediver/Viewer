import {AbstractCamera} from "./implementation/camera/AbstractCamera";
import {OrthographicCamera} from "./implementation/camera/OrthographicCamera";
import {PerspectiveCamera} from "./implementation/camera/PerspectiveCamera";
import {CameraEngine} from "./implementation/CameraEngine";
import {OrthographicCameraControls} from "./implementation/controls/OrthographicCameraControls";
import {PerspectiveCameraControls} from "./implementation/controls/PerspectiveCameraControls";
import {ICamera, ICameraOptions} from "./interfaces/camera/ICamera";
import {
	IOrthographicCamera,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
} from "./interfaces/camera/IOrthographicCamera";
import {IPerspectiveCamera} from "./interfaces/camera/IPerspectiveCamera";
import {ICameraControls} from "./interfaces/controls/ICameraControls";
import {CAMERA_TYPE, ICameraEngine} from "./interfaces/ICameraEngine";

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
};
export {PerspectiveCameraControls, OrthographicCameraControls};

// Utility type to extract non-readonly properties
type WritableKeys<T> = {
	[K in keyof T]: T[K] extends Readonly<any> ? never : K;
}[keyof T];

type Writable<T> = Pick<T, WritableKeys<T>>;

// Extract writable properties from camera types
type WritableOrthographicCamera = Writable<IOrthographicCamera>;
type WritablePerspectiveCamera = Writable<IPerspectiveCamera>;

// Ensure either 'name' or 'type' must be defined
type CameraWithNameOrType<T> = T & ({name: string} | {type: CAMERA_TYPE});

export type OrthographicCameraProperties = CameraWithNameOrType<
	Partial<WritableOrthographicCamera>
>;
export type PerspectiveCameraProperties = CameraWithNameOrType<
	Partial<WritablePerspectiveCamera>
>;
