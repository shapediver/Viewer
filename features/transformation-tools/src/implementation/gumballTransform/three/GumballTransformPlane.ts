import {
	DoubleSide,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	PlaneGeometry,
	Quaternion,
	Vector3,
} from "three";

import {GumballTransformControls, TransformationType} from "./GumballTransformControls";

export class GumballTransformPlane extends Mesh {
	public isGumballTransformPlane: true;
	public type: "GumballTransformPlane";

	constructor(readonly _gumballTransformControls: GumballTransformControls) {
		super(
			new PlaneGeometry(100000, 100000, 2, 2),
			new MeshBasicMaterial({
				visible: false,
				wireframe: true,
				side: DoubleSide,
				transparent: true,
				opacity: 0.1,
				toneMapped: false,
			}),
		);

		this.isGumballTransformPlane = true;

		this.type = "GumballTransformPlane";
	}

	public updateMatrixWorld(force: boolean) {
		const space = this._gumballTransformControls.space;

		this.position.copy(this._gumballTransformControls.worldPosition);

		_v1.copy(_unitX).applyQuaternion(
			space === "local"
				? this._gumballTransformControls.worldQuaternion
				: _identityQuaternion,
		);
		_v2.copy(_unitY).applyQuaternion(
			space === "local"
				? this._gumballTransformControls.worldQuaternion
				: _identityQuaternion,
		);
		_v3.copy(_unitZ).applyQuaternion(
			space === "local"
				? this._gumballTransformControls.worldQuaternion
				: _identityQuaternion,
		);

		// Align the plane for current transform mode, axis and space.

		_alignVector.copy(_v2);

		if (
			this._gumballTransformControls.mode === TransformationType.TRANSLATION ||
			this._gumballTransformControls.mode === TransformationType.SCALE
		) {
			switch (this._gumballTransformControls.axis) {
				case "X":
					_alignVector.copy(this._gumballTransformControls.eye).cross(_v1);
					_dirVector.copy(_v1).cross(_alignVector);
					break;
				case "Y":
					_alignVector.copy(this._gumballTransformControls.eye).cross(_v2);
					_dirVector.copy(_v2).cross(_alignVector);
					break;
				case "Z":
					_alignVector.copy(this._gumballTransformControls.eye).cross(_v3);
					_dirVector.copy(_v3).cross(_alignVector);
					break;
				case "XY":
					_dirVector.copy(_v3);
					break;
				case "YZ":
					_dirVector.copy(_v1);
					break;
				case "XZ":
					_alignVector.copy(_v3);
					_dirVector.copy(_v2);
					break;
				case "XYZ":
				case "E":
					_dirVector.set(0, 0, 0);
					break;
				default:
			}
		}

		if (this._gumballTransformControls.mode === TransformationType.ROTATION) {
			// special case for rotate
			_dirVector.set(0, 0, 0);
		}

		if (_dirVector.length() === 0) {
			// If in rotate mode, make the plane parallel to camera
			this.quaternion.copy(this._gumballTransformControls.cameraQuaternion);
		} else {
			_tempMatrix.lookAt(
				_tempVector.set(0, 0, 0),
				_dirVector,
				_alignVector,
			);

			this.quaternion.setFromRotationMatrix(_tempMatrix);
		}

		super.updateMatrixWorld(force);
	}
}

const _alignVector = new Vector3(0, 1, 0);
const _dirVector = new Vector3();
const _identityQuaternion = new Quaternion();
const _tempMatrix = new Matrix4();
const _tempVector = new Vector3();
const _unitX = new Vector3(1, 0, 0);
const _unitY = new Vector3(0, 1, 0);
const _unitZ = new Vector3(0, 0, 1);
const _v1 = new Vector3();
const _v2 = new Vector3();
const _v3 = new Vector3();
