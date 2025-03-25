import {Camera, Matrix4, Object3D, Scene, Vector2, Vector3} from "three";

class CSS2DObject extends Object3D {
	// #region Properties (3)

	public center: Vector2;
	public element: HTMLElement;
	public isCSS2DObject: boolean;

	// #endregion Properties (3)

	// #region Constructors (1)

	constructor(element = document.createElement("div")) {
		super();

		this.isCSS2DObject = true;

		this.element = element;

		this.element.style.position = "absolute";
		this.element.style.userSelect = "none";

		this.element.setAttribute("draggable", "false");

		this.center = new Vector2(0.5, 0.5); // ( 0, 0 ) is the lower left; ( 1, 1 ) is the top right

		this.addEventListener("removed", () => {
			this.traverse((o: Object3D) => {
				const object = o as CSS2DObject;

				if (
					object.element instanceof Element &&
					object.element.parentNode !== null
				) {
					object.element.parentNode.removeChild(object.element);
				}
			});
		});
	}

	// #endregion Constructors (1)

	// #region Public Methods (1)

	public copy(source: this, recursive?: boolean): this {
		super.copy(source, recursive);

		this.element = source.element.cloneNode(true) as HTMLDivElement;

		this.center = source.center;

		return this;
	}

	// #endregion Public Methods (1)
}

//

const _vector = new Vector3();
const _viewMatrix = new Matrix4();
const _viewProjectionMatrix = new Matrix4();
const _a = new Vector3();
const _b = new Vector3();

type CSS2DParameters = {
	element?: HTMLElement;
};

class CSS2DRenderer {
	// #region Properties (6)

	private readonly _cache = {
		objects: new WeakMap(),
	};

	private _height: number = 0;
	private _heightHalf: number = 0;
	private _width: number = 0;
	private _widthHalf: number = 0;

	public domElement: HTMLElement;

	// #endregion Properties (6)

	// #region Constructors (1)

	constructor(parameters?: CSS2DParameters) {
		const domElement =
			parameters?.element !== undefined
				? parameters.element
				: document.createElement("div");

		domElement.style.overflow = "hidden";

		this.domElement = domElement;
	}

	// #endregion Constructors (1)

	// #region Public Methods (7)

	public filterAndFlatten(scene: Scene) {
		const result: CSS2DObject[] = [];

		scene.traverse((object) => {
			if ((object as CSS2DObject).isCSS2DObject)
				result.push(object as CSS2DObject);
		});

		return result;
	}

	public getDistanceToSquared(object1: Object3D, object2: Object3D) {
		_a.setFromMatrixPosition(object1.matrixWorld);
		_b.setFromMatrixPosition(object2.matrixWorld);

		return _a.distanceToSquared(_b);
	}

	public getSize(): {width: number; height: number} {
		return {
			width: this._width,
			height: this._height,
		};
	}

	public render(scene: Scene, camera: Camera) {
		if (scene.matrixWorldAutoUpdate === true) scene.updateMatrixWorld();
		if (camera.parent === null && camera.matrixWorldAutoUpdate === true)
			camera.updateMatrixWorld();

		_viewMatrix.copy(camera.matrixWorldInverse);
		_viewProjectionMatrix.multiplyMatrices(
			camera.projectionMatrix,
			_viewMatrix,
		);

		this.renderObject(scene, scene, camera);
		this.zOrder(scene);
	}

	public renderObject(o: Object3D, scene: Scene, camera: Camera) {
		if ((o as CSS2DObject).isCSS2DObject) {
			const object = o as CSS2DObject;
			_vector.setFromMatrixPosition(object.matrixWorld);
			_vector.applyMatrix4(_viewProjectionMatrix);

			const visible =
				object.visible === true &&
				_vector.z >= -1 &&
				_vector.z <= 1 &&
				object.layers.test(camera.layers) === true;
			object.element.style.display = visible === true ? "" : "none";

			if (visible === true) {
				(
					object as unknown as {
						onBeforeRender: (
							renderer: unknown,
							scene: Scene,
							camera: Camera,
						) => void;
					}
				).onBeforeRender(this, scene, camera);

				const element = object.element;

				element.style.transform =
					"translate(" +
					-100 * object.center.x +
					"%," +
					-100 * object.center.y +
					"%)" +
					"translate(" +
					(_vector.x * this._widthHalf + this._widthHalf) +
					"px," +
					(-_vector.y * this._heightHalf + this._heightHalf) +
					"px)";

				if (element.parentNode !== this.domElement) {
					this.domElement.appendChild(element);
				}

				(
					object as unknown as {
						onAfterRender: (
							renderer: unknown,
							scene: Scene,
							camera: Camera,
						) => void;
					}
				).onAfterRender(this, scene, camera);
			}

			const objectData = {
				distanceToCameraSquared: this.getDistanceToSquared(
					camera,
					object,
				),
			};

			this._cache.objects.set(object, objectData);
		}

		for (let i = 0, l = o.children.length; i < l; i++) {
			this.renderObject(o.children[i], scene, camera);
		}
	}

	public setSize(width: number, height: number) {
		this._width = width;
		this._height = height;

		this._widthHalf = this._width / 2;
		this._heightHalf = this._height / 2;

		this.domElement.style.width = width + "px";
		this.domElement.style.height = height + "px";
	}

	public zOrder(scene: Scene) {
		const sorted = this.filterAndFlatten(scene).sort((a, b) => {
			if (a.renderOrder !== b.renderOrder) {
				return b.renderOrder - a.renderOrder;
			}

			const distanceA =
				this._cache.objects.get(a).distanceToCameraSquared;
			const distanceB =
				this._cache.objects.get(b).distanceToCameraSquared;

			return distanceA - distanceB;
		});

		const zMax = sorted.length;

		for (let i = 0, l = sorted.length; i < l; i++) {
			sorted[i].element.style.zIndex = zMax - i + "";
		}
	}

	// #endregion Public Methods (7)
}

export {CSS2DObject, CSS2DRenderer};
