import {IBox, ISphere} from "@shapediver/viewer.shared.math";
import {ITreeNode, ITreeNodeData} from "@shapediver/viewer.shared.node-tree";
import {SettingsEngine} from "@shapediver/viewer.shared.services";
import {CAMERA_TYPE, ICameraOptions} from "@shapediver/viewer.shared.types";
import {vec2, vec3} from "gl-matrix";
import {ICameraControls} from "../controls/ICameraControls";

// #region Interfaces (2)

export interface ICamera extends ITreeNodeData {
	// #region Properties (21)

	readonly controls: ICameraControls;
	readonly id: string;
	readonly type: CAMERA_TYPE;
	readonly isDefault: boolean;

	active: boolean;
	autoAdjust: boolean;
	boundingBox: IBox;
	cameraMovementDuration: number;
	defaultPosition: vec3;
	defaultTarget: vec3;
	domEventListenerToken?: string;
	enableCameraControls: boolean;
	initialAutoAdjust: boolean;
	name?: string;
	node?: ITreeNode;
	order?: number;
	position: vec3;
	revertAtMouseUp: boolean;
	revertAtMouseUpDuration: number;
	sceneRotation: vec2;
	target: vec3;
	useNodeData: boolean;
	zoomExtentsFactor: number;

	// #endregion Properties (21)

	// #region Public Methods (8)

	animate(
		path: {position: vec3; target: vec3}[],
		options?: ICameraOptions,
	): Promise<boolean>;
	applySettings(settingsEngine: SettingsEngine): void;
	boundingSphereVisible(sphere: ISphere): boolean;
	calculateZoomTo(
		zoomTarget?: IBox,
		startingPosition?: vec3,
		startingTarget?: vec3,
	): {position: vec3; target: vec3};
	destroy(): void;
	project(p: vec3): vec2;
	reset(options?: ICameraOptions): Promise<boolean>;
	set(
		position: vec3,
		target: vec3,
		options?: ICameraOptions,
	): Promise<boolean>;
	unproject(p: vec3): vec3;
	zoomTo(zoomTarget?: IBox, options?: ICameraOptions): Promise<boolean>;

	// #endregion Public Methods (8)
}
