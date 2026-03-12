import {
	DoubleSide,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	PlaneGeometry,
	Quaternion,
	Vector3,
} from "three";
import {TransformationType, TransformControls} from "./TransformControls";

const _alignVector = new Vector3(0, 1, 0);
const _tempVector = new Vector3();
const _identityQuaternion = new Quaternion();
const _dirVector = new Vector3();
const _tempMatrix = new Matrix4();

const _unitX = new Vector3(1, 0, 0);
const _unitY = new Vector3(0, 1, 0);
const _unitZ = new Vector3(0, 0, 1);

const _v1 = new Vector3();
const _v2 = new Vector3();
const _v3 = new Vector3();

export class TransformControlsPlane extends Mesh {
	// #region Properties (2)

	public isTransformControlsPlane: true;
	public type: "TransformControlsPlane";

	// #endregion Properties (2)

	// #region Constructors (1)

	constructor(readonly _transformControls: TransformControls) {
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

		this.isTransformControlsPlane = true;

		this.type = "TransformControlsPlane";
	}

	// #endregion Constructors (1)

	// #region Public Methods (1)

	public updateMatrixWorld(force: boolean) {
		const space = this._transformControls.space;

		this.position.copy(this._transformControls.worldPosition);

		_v1.copy(_unitX).applyQuaternion(
			space === "local"
				? this._transformControls.worldQuaternion
				: _identityQuaternion,
		);
		_v2.copy(_unitY).applyQuaternion(
			space === "local"
				? this._transformControls.worldQuaternion
				: _identityQuaternion,
		);
		_v3.copy(_unitZ).applyQuaternion(
			space === "local"
				? this._transformControls.worldQuaternion
				: _identityQuaternion,
		);

		// Align the plane for current transform mode, axis and space.

		_alignVector.copy(_v2);

		if (
			this._transformControls.mode === TransformationType.TRANSLATION ||
			this._transformControls.mode === TransformationType.SCALE
		) {
			switch (this._transformControls.axis) {
				case "X":
					_alignVector.copy(this._transformControls.eye).cross(_v1);
					_dirVector.copy(_v1).cross(_alignVector);
					break;
				case "Y":
					_alignVector.copy(this._transformControls.eye).cross(_v2);
					_dirVector.copy(_v2).cross(_alignVector);
					break;
				case "Z":
					_alignVector.copy(this._transformControls.eye).cross(_v3);
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

		if (this._transformControls.mode === TransformationType.ROTATION) {
			// special case for rotate
			_dirVector.set(0, 0, 0);
		}

		if (_dirVector.length() === 0) {
			// If in rotate mode, make the plane parallel to camera
			this.quaternion.copy(this._transformControls.cameraQuaternion);
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

	// #endregion Public Methods (1)
}
