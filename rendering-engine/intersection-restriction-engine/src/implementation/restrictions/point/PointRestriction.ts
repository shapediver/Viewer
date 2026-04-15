import {ITreeNode, IViewportApi, MaterialEngine} from "@shapediver/viewer";
import {
	IMapData,
	IRay,
	IVisualizationSettings,
} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import * as THREE from "three";
import {
	IRestriction,
	RestrictionMetaData,
	RestrictionPropertiesBase,
	RestrictionResult,
} from "../../../interfaces/IRestriction";
import {ISnapRestriction} from "../../../interfaces/ISnapRestriction";
import {GeometryMathManager} from "../../GeometryMathManager";
import {AbstractRestriction} from "../AbstractRestriction";

let pointTexture: Promise<THREE.Texture> | THREE.Texture =
	MaterialEngine.instance
		.loadMap("https://viewer.shapediver.com/v3/graphics/point_soft.png")
		.then((mapData: IMapData | undefined) => {
			pointTexture = new THREE.Texture(
				mapData!.image as HTMLImageElement,
			);
			pointTexture.needsUpdate = true;
			return pointTexture;
		});
// #region Type aliases (1)

export interface PointRestrictionProperties extends RestrictionPropertiesBase {
	/**
	 * The location of the restriction.
	 */
	point: vec3;
	/**
	 * The radius in which the restriction is active.
	 */
	radius?: number;
	/**
	 * If the restriction should be displayed as a wireframe point.
	 */
	wireframe?: boolean;
	/**
	 * The color of the wireframe.
	 */
	wireframeColor?: string;
	/**
	 * The size of the wireframe point.
	 */
	wireframeSize?: number;
}

// #endregion Type aliases (1)

// #region Classes (1)

export class PointRestriction
	extends AbstractRestriction
	implements IRestriction
{
	// #region Properties (8)

	readonly #viewport: IViewportApi;

	#point: vec3;
	#radius: number;
	#settings: IVisualizationSettings;
	#snapRestrictions: {[key: string]: ISnapRestriction} = {};
	#visualizationObject: THREE.Object3D = new THREE.Object3D();
	#wireframe: boolean;
	#wireframeColor: string;
	#wireframeSize: number = 1;

	// #endregion Properties (8)

	// #region Constructors (1)

	constructor(
		viewport: IViewportApi,
		geometryMathManager: GeometryMathManager,
		parentNode: ITreeNode,
		id: string,
		settings: IVisualizationSettings,
		properties: PointRestrictionProperties,
	) {
		super(viewport, parentNode, id, properties);

		this.#viewport = viewport;
		this.#point = properties.point;
		this.#radius = properties.radius || 0;
		this.#settings = settings;
		this.#wireframe = properties.wireframe ?? settings.wireframe ?? true;
		this.#wireframeColor =
			properties.wireframeColor ??
			settings.wireframeColor ??
			(settings.points.color_1 as string);
		this.#wireframeSize = properties.wireframeSize ?? 15;

		if (this.#wireframe) {
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute(
				"position",
				new THREE.Float32BufferAttribute(
					[this.#point[0], this.#point[1], this.#point[2]],
					3,
				),
			);

			const height = this.#viewport.canvas.height;
			const pointSize = this.#wireframeSize * (height / 1080);

			const material = new THREE.PointsMaterial({
				color: new THREE.Color(this.#wireframeColor),
				size: pointSize,
				sizeAttenuation: false,
				depthTest: false,
				depthWrite: false,
				transparent: true,
				...(pointTexture instanceof THREE.Texture
					? {map: pointTexture}
					: {}),
			});
			if (pointTexture instanceof Promise) {
				pointTexture.then((texture) => {
					material.map = texture;
					material.needsUpdate = true;
				});
			}
			const points = new THREE.Points(geometry, material);
			points.renderOrder = 100;
			points.matrixAutoUpdate = false;
			this.#visualizationObject.add(points);
			this._object3D.add(this.#visualizationObject);
		}
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (4)

	public get point(): vec3 {
		return this.#point;
	}

	public get radius(): number {
		return this.#radius;
	}

	public get snapRestrictions(): {[key: string]: ISnapRestriction} {
		return this.#snapRestrictions;
	}

	// #endregion Public Getters And Setters (4)

	// #region Public Methods (1)

	public isWithinRadius(point: vec3): boolean {
		return (
			vec3.squaredDistance(point, this.#point) <=
			this.#radius * this.#radius
		);
	}

	public rayTrace(
		ray: IRay,
		metaData?: RestrictionMetaData,
	): RestrictionResult | undefined {
		const closestPointVector = vec3.sub(
			vec3.create(),
			this.#point,
			ray.origin,
		);
		const t = Math.max(0, vec3.dot(closestPointVector, ray.direction));

		const closestPoint = vec3.create();
		vec3.scaleAndAdd(closestPoint, ray.origin, ray.direction, t);

		const distance = vec3.squaredDistance(closestPoint, this.#point);
		if (distance < this.#radius * this.#radius) {
			// check if origin is inside the sphere
			const distanceOrigin = vec3.squaredDistance(
				ray.origin,
				this.#point,
			);
			if (distanceOrigin < this.#radius * this.#radius) {
				return {
					closestIntersectionPoint: closestPoint,
					distanceOriginToClosestIntersectionPointSquared:
						distanceOrigin,
					targetPoint: this.#point,
					distanceClosestPointToTargetPointSquared: distance,
					restriction: this,
				};
			}

			// now we calculate the closest point on the sphere to the ray
			const offset = Math.sqrt(this.#radius * this.#radius - distance);
			// Compute the entry distance
			const entry = t - offset;
			const closestIntersectionPoint = vec3.scaleAndAdd(
				vec3.create(),
				ray.origin,
				ray.direction,
				entry,
			);

			return {
				closestIntersectionPoint: closestIntersectionPoint,
				distanceOriginToClosestIntersectionPointSquared: entry * entry,
				targetPoint: this.#point,
				distanceClosestPointToTargetPointSquared: distance,
				restriction: this,
			};
		}
		return;
	}

	// #endregion Public Methods (1)

	// #region Protected Methods (1)

	protected visibilityChanged(): void {}

	// #endregion Protected Methods (1)
}

// #endregion Classes (1)
