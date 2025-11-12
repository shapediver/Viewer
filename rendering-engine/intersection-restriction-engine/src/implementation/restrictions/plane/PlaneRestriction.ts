import {
	CAMERA_TYPE,
	ICameraApi,
	IOrthographicCameraApi,
	ITreeNode,
	IViewportApi,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
} from "@shapediver/viewer";
import {IPlane, Plane} from "@shapediver/viewer.shared.math";
import {IRay, IVisualizationSettings} from "@shapediver/viewer.shared.types";
import {mat4, vec3} from "gl-matrix";
import {
	IRestriction,
	isDraggingRestriction,
	isDrawingRestriction,
	RestrictionMetaData,
	RestrictionPropertiesBase,
	RestrictionResult,
} from "../../../interfaces/IRestriction";
import {ISnapRestriction} from "../../../interfaces/ISnapRestriction";
import {GeometryMathManager} from "../../GeometryMathManager";
import {AbstractRestriction} from "../AbstractRestriction";
import {
	AngularRestriction,
	AngularRestrictionProperties,
} from "./snap/AngularRestriction";
import {
	AxisRestriction,
	AxisRestrictionProperties,
} from "./snap/AxisRestriction";
import {
	GridRestriction,
	GridRestrictionProperties,
} from "./snap/GridRestriction";

// #region Type aliases (1)

export interface PlaneRestrictionProperties extends RestrictionPropertiesBase {
	/**
	 * The origin of the plane.
	 *
	 * @default vec3.fromValues(0, 0, 0)
	 */
	origin?: vec3;

	/**
	 * Vector U of the plane
	 * with the cross product of vector_u and vector_v the normal of the plane can be calculated
	 */
	vector_u?: vec3;

	/**
	 * Vector V of the plane
	 * with the cross product of vector_u and vector_v the normal of the plane can be calculated
	 */
	vector_v?: vec3;

	/**
	 * grid snap restriction
	 */
	gridSnapRestriction?: GridRestrictionProperties;

	/**
	 * angular snap restriction
	 */
	angularSnapRestriction?: AngularRestrictionProperties;

	/**
	 * axis snap restriction
	 */
	axisSnapRestriction?: AxisRestrictionProperties;
}

// #endregion Type aliases (1)

// #region Classes (1)

export class PlaneRestriction
	extends AbstractRestriction
	implements IRestriction
{
	// #region Properties (14)

	readonly #properties: PlaneRestrictionProperties;
	readonly #viewport: IViewportApi;

	#angularRestriction: AngularRestriction;
	#axisRestriction: AxisRestriction;
	#cameraId: string = "";
	#gridRestriction: GridRestriction;
	#normal: vec3 = vec3.create();
	#origin: vec3 = vec3.create();
	#plane: IPlane = new Plane();
	#snapRestrictions: {[key: string]: ISnapRestriction};
	#transformationFromXYPlaneMatrix: mat4 = mat4.create();
	#transformationToXYPlaneMatrix: mat4 = mat4.create();
	#vectorU: vec3 = vec3.create();
	#vectorV: vec3 = vec3.create();

	// #endregion Properties (14)

	// #region Constructors (1)

	constructor(
		viewport: IViewportApi,
		geometryMathManager: GeometryMathManager,
		parentNode: ITreeNode,
		id: string,
		settings: IVisualizationSettings,
		properties: PlaneRestrictionProperties,
	) {
		super(viewport, parentNode, id, properties);

		this.#viewport = viewport;
		this.#cameraId = this.#viewport.camera!.id;
		this.#properties = properties;

		this.#gridRestriction = new GridRestriction(
			viewport,
			geometryMathManager,
			parentNode,
			this,
			this.#properties.gridSnapRestriction,
		);
		this.#angularRestriction = new AngularRestriction(
			viewport,
			geometryMathManager,
			parentNode,
			this,
			settings,
			this.#properties.angularSnapRestriction,
		);
		this.#axisRestriction = new AxisRestriction(
			viewport,
			geometryMathManager,
			parentNode,
			this,
			this.#properties.axisSnapRestriction,
		);

		this.updatePlaneDefinition();

		this.#snapRestrictions = {
			grid: this.#gridRestriction,
			angular: this.#angularRestriction,
			axis: this.#axisRestriction,
		};
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (14)

	public get angularRestriction(): AngularRestriction {
		return this.#angularRestriction;
	}

	public get axisRestriction(): AxisRestriction {
		return this.#axisRestriction;
	}

	public get gridRestriction(): GridRestriction {
		return this.#gridRestriction;
	}

	public get normal(): vec3 {
		return this.#normal;
	}

	public get origin(): vec3 {
		return this.#origin;
	}

	public set origin(value: vec3) {
		this.#origin = value;
		this.updatePlaneDefinition();
	}

	public get snapRestrictions(): {[key: string]: ISnapRestriction} {
		return this.#snapRestrictions;
	}

	public get transformationFromXYPlaneMatrix(): mat4 {
		return this.#transformationFromXYPlaneMatrix;
	}

	public get transformationToXYPlaneMatrix(): mat4 {
		return this.#transformationToXYPlaneMatrix;
	}

	public get vectorU(): vec3 {
		return this.#vectorU;
	}

	public set vectorU(value: vec3) {
		this.#properties.vector_u = value;
		this.updatePlaneDefinition();
	}

	public get vectorV(): vec3 {
		return this.#vectorV;
	}

	public set vectorV(value: vec3) {
		this.#properties.vector_v = value;
		this.updatePlaneDefinition();
	}

	// #endregion Public Getters And Setters (14)

	// #region Public Methods (1)

	public rayTrace(
		ray: IRay,
		metaData?: RestrictionMetaData,
	): RestrictionResult | undefined {
		if (this.enabled === false) return;

		if (isDrawingRestriction(metaData)) {
			if (this.#cameraId !== this.#viewport.camera!.id)
				this.updatePlaneDefinition();

			let origin = this.#origin;
			if (metaData.startPoint)
				origin = vec3.sub(
					vec3.create(),
					this.#origin,
					vec3.scale(
						vec3.create(),
						this.#normal,
						vec3.dot(
							vec3.sub(
								vec3.create(),
								this.#origin,
								metaData.startPoint,
							),
							this.#normal,
						),
					),
				);

			// find intersection of ray and plane
			const t =
				(vec3.dot(origin, this.#normal) -
					vec3.dot(ray.origin, this.#normal)) /
				vec3.dot(ray.direction, this.#normal);
			const intersection = vec3.add(
				vec3.create(),
				ray.origin,
				vec3.multiply(
					vec3.create(),
					ray.direction,
					vec3.fromValues(t, t, t),
				),
			);

			return this.snap(ray, intersection, t, metaData);
		} else if (isDraggingRestriction(metaData)) {
			const distance = this.#plane.intersect(ray.origin, ray.direction);
			if (distance && distance > 0) {
				const intersection = vec3.add(
					vec3.create(),
					vec3.multiply(
						vec3.create(),
						ray.direction,
						vec3.fromValues(distance, distance, distance),
					),
					ray.origin,
				);
				return this.snap(ray, intersection, distance, metaData);
			}
		}
	}

	// #endregion Public Methods (1)

	// #region Protected Methods (1)

	protected visibilityChanged(): void {}

	// #endregion Protected Methods (1)

	// #region Private Methods (4)

	private createDefaultPlane(camera: ICameraApi): void {
		if (
			camera.type === CAMERA_TYPE.PERSPECTIVE ||
			(camera.type === CAMERA_TYPE.ORTHOGRAPHIC &&
				(camera as IOrthographicCameraApi).direction ===
					ORTHOGRAPHIC_CAMERA_DIRECTION.CUSTOM)
		) {
			this.#vectorU = vec3.fromValues(1, 0, 0);
			this.#vectorV = vec3.fromValues(0, 1, 0);
			this.#normal = vec3.fromValues(0, 0, 1);
			this.#origin = vec3.fromValues(0, 0, 0);
		} else {
			const orthographicCamera = camera as IOrthographicCameraApi;
			const direction = vec3.normalize(
				vec3.create(),
				vec3.sub(
					vec3.create(),
					orthographicCamera.target,
					orthographicCamera.position,
				),
			);
			const up =
				orthographicCamera.direction ===
					ORTHOGRAPHIC_CAMERA_DIRECTION.TOP ||
				orthographicCamera.direction ===
					ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM
					? vec3.fromValues(0, 1, 0)
					: vec3.fromValues(0, 0, 1);

			this.#origin = vec3.fromValues(0, 0, 0);
			this.#normal = vec3.negate(vec3.create(), direction);
			this.#vectorU = vec3.clone(up);
			this.#vectorV = vec3.normalize(
				vec3.create(),
				vec3.cross(vec3.create(), this.#normal, this.#vectorU),
			);
		}
	}

	private createTransformationMatrices(): void {
		// Calculate the transformation matrix for the rotation
		const rotationMatrix = mat4.fromValues(
			this.#vectorU[0],
			this.#vectorV[0],
			this.#normal[0],
			0,
			this.#vectorU[1],
			this.#vectorV[1],
			this.#normal[1],
			0,
			this.#vectorU[2],
			this.#vectorV[2],
			this.#normal[2],
			0,
			0,
			0,
			0,
			1,
		);

		let rotationMatrixInverse = mat4.invert(mat4.create(), rotationMatrix);
		if (!rotationMatrixInverse) rotationMatrixInverse = mat4.create();

		const pivotMatrix = mat4.fromTranslation(
			mat4.create(),
			vec3.fromValues(this.#origin[0], this.#origin[1], this.#origin[2]),
		);
		const pivotMatrixInverse = mat4.fromTranslation(
			mat4.create(),
			vec3.fromValues(
				-this.#origin[0],
				-this.#origin[1],
				-this.#origin[2],
			),
		);

		mat4.multiply(
			this.#transformationToXYPlaneMatrix,
			pivotMatrix,
			rotationMatrix,
		);
		mat4.multiply(
			this.#transformationToXYPlaneMatrix,
			this.#transformationToXYPlaneMatrix,
			pivotMatrixInverse,
		);

		mat4.multiply(
			this.#transformationFromXYPlaneMatrix,
			pivotMatrix,
			rotationMatrixInverse,
		);
		mat4.multiply(
			this.#transformationFromXYPlaneMatrix,
			this.#transformationFromXYPlaneMatrix,
			pivotMatrixInverse,
		);
	}

	private snap(
		ray: IRay,
		point: vec3,
		distance: number,
		metaData?: RestrictionMetaData,
	): RestrictionResult | undefined {
		if (this.enabled === false) return;

		if (this.#cameraId !== this.#viewport.camera!.id)
			this.updatePlaneDefinition();

		const sortedSnapRestrictions = Object.values(
			this.#snapRestrictions,
		).sort((a, b) => b.priority - a.priority);

		// group snap restrictions by priority
		const groupedSnapRestrictions: {[key: number]: ISnapRestriction[]} = {};
		for (const snapRestriction of sortedSnapRestrictions) {
			if (!groupedSnapRestrictions[snapRestriction.priority])
				groupedSnapRestrictions[snapRestriction.priority] = [];
			groupedSnapRestrictions[snapRestriction.priority].push(
				snapRestriction,
			);
		}

		// call snap method for each group
		for (const snapRestrictions of Object.values(groupedSnapRestrictions)) {
			const results = [];
			for (const snapRestriction of snapRestrictions) {
				results.push(
					snapRestriction.snap(ray, point, distance, metaData),
				);
			}

			const indexedResults = results.map((value, index) => ({
				index,
				value,
			}));

			// find the result that is closest to the point and set the snap restriction to active
			indexedResults.sort((a, b) => {
				if (!a.value) return 1;
				if (!b.value) return -1;
				return (
					vec3.squaredDistance(point, a.value.targetPoint) -
					vec3.squaredDistance(point, b.value.targetPoint)
				);
			});

			for (const snapRestriction of snapRestrictions) {
				snapRestriction.active = false;
			}

			// if a snap restriction returned a result, return it
			if (indexedResults[0].value !== undefined) {
				snapRestrictions[indexedResults[0].index].active = true;
				return indexedResults[0].value;
			}
		}

		return {
			closestIntersectionPoint: point,
			distanceOriginToClosestIntersectionPointSquared: vec3.sqrDist(
				ray.origin,
				point,
			),
			targetPoint: point,
			distanceClosestPointToTargetPointSquared: 0,
			restriction: this,
		};
	}

	private updatePlaneDefinition(): void {
		const camera = this.#viewport.camera!;
		this.#cameraId = camera!.id;

		const origin = this.#properties.origin
			? vec3.clone(this.#properties.origin)
			: vec3.fromValues(0, 0, 0);
		const vectorU = this.#properties.vector_u
			? vec3.clone(this.#properties.vector_u)
			: undefined;
		const vectorV = this.#properties.vector_v
			? vec3.clone(this.#properties.vector_v)
			: undefined;

		const planeDefined = origin && vectorU && vectorV;

		let normal = vec3.fromValues(0, 0, 1);

		if (planeDefined) {
			vec3.normalize(vectorU, vectorU);
			vec3.normalize(vectorV, vectorV);

			normal = vec3.normalize(
				vec3.create(),
				vec3.cross(vec3.create(), vectorU, vectorV),
			);
			if (vec3.dot(vectorU, vectorV) !== 0)
				vec3.normalize(
					vectorV,
					vec3.cross(vec3.create(), normal, vectorU),
				);

			if (camera.type === CAMERA_TYPE.ORTHOGRAPHIC) {
				const cameraApi = camera as IOrthographicCameraApi;
				const cameraDirection = vec3.normalize(
					vec3.create(),
					vec3.sub(
						vec3.create(),
						cameraApi.target,
						cameraApi.position,
					),
				);

				// if the dot product of the camera direction and the normal tells us that they are parallel
				// the plane is perpendicular to the camera direction
				if (Math.abs(vec3.dot(cameraDirection, normal)) < 0.0001) {
					this.createDefaultPlane(camera);
				} else {
					this.#vectorU = vectorU;
					this.#vectorV = vectorV;
					this.#normal = normal;
					this.#origin = origin;
				}
			} else {
				this.#vectorU = vectorU;
				this.#vectorV = vectorV;
				this.#normal = normal;
				this.#origin = origin;
			}
		} else {
			this.createDefaultPlane(camera);
		}

		this.#plane = new Plane().setFromNormalAndCoplanarPoint(
			this.#normal,
			this.#origin,
		);

		this.createTransformationMatrices();
		this.#gridRestriction.updatePlaneDefinition();
		this.#angularRestriction.updatePlaneDefinition();
		this.#axisRestriction.updatePlaneDefinition();
	}

	// #endregion Private Methods (4)
}

// #endregion Classes (1)
