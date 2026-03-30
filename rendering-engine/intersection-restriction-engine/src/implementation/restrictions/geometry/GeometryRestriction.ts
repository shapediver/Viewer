import {IViewportApi, sceneTree} from "@shapediver/viewer";
import {SDObject} from "@shapediver/viewer.rendering-engine.rendering-engine-threejs/dist/objects/SDObject";
import {Box} from "@shapediver/viewer.shared.math";
import {GeometryData, ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {EventEngine, EVENTTYPE} from "@shapediver/viewer.shared.services";
import {
	IGeometryData,
	IRay,
	ISceneEvent,
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

// #region Type aliases (1)

export interface GeometryRestrictionProperties
	extends RestrictionPropertiesBase {
	/**
	 * The nodes to restrict the interaction to.
	 */
	nodes: ITreeNode[];
	/**
	 * If the geometry should be displayed as wireframe.
	 */
	wireframe?: boolean;
	/**
	 * The color of the wireframe.
	 */
	wireframeColor?: string;
	/**
	 * If the restriction should snap to vertices. (default: true)
	 */
	snapToVertices?: boolean;
	/**
	 * The radius in which the restriction should snap to vertices. (default: 2.5% of the scene bounding sphere radius in screen space)
	 */
	snapToVerticesRadius?: number;
	/**
	 * If the restriction should snap to edges. (default: true)
	 */
	snapToEdges?: boolean;
	/**
	 * The radius in which the restriction should snap to edges. (default: 2.5% of the scene bounding sphere radius in screen space)
	 */
	snapToEdgesRadius?: number;
	/**
	 * If the restriction should snap to faces. (default: true)
	 */
	snapToFaces?: boolean;
}

/**
 * The data of the intersection of the geometry restriction.
 * This data is forwarded for internal use.
 */
export interface GeometryRestrictionIntersectionData {
	node: ITreeNode;
	geometryData: IGeometryData;
}

// #endregion Type aliases (1)

// #region Classes (1)

export class GeometryRestriction
	extends AbstractRestriction
	implements IRestriction
{
	// #region Properties (17)

	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #rayCasterParams: THREE.RaycasterParameters = {
		Line: {threshold: 1},
		Line2: {threshold: 1},
		Points: {threshold: 1},
		Mesh: {},
		LOD: {},
		Sprite: {},
	};
	readonly #raycaster = new THREE.Raycaster();
	readonly #viewport: IViewportApi;

	#geometryMathManager: GeometryMathManager;
	#lineIntersectionPercentage: number = 0.025;
	#nodes: ITreeNode[] = [];
	#pointIntersectionPercentage: number = 0.025;
	#sceneBoundingSphereRadius: number = 0;
	#settings: IVisualizationSettings;
	#snapRestrictions: {[key: string]: ISnapRestriction} = {};
	#snapToEdges: boolean = true;
	#snapToEdgesRadius?: number;
	#snapToFaces: boolean = true;
	#snapToVertices: boolean = true;
	#snapToVerticesRadius?: number;
	#visualizationObject: THREE.Object3D = new THREE.Object3D();
	#wireframe: boolean;
	#wireframeColor: string;

	// #endregion Properties (17)

	// #region Constructors (1)

	constructor(
		viewport: IViewportApi,
		geometryMathManager: GeometryMathManager,
		parentNode: ITreeNode,
		id: string,
		settings: IVisualizationSettings,
		properties: GeometryRestrictionProperties,
	) {
		super(viewport, parentNode, id, properties);
		this.#viewport = viewport;
		this.#settings = settings;
		this.#geometryMathManager = geometryMathManager;
		this.#wireframe =
			properties.wireframe ?? this.#settings.wireframe ?? true;
		this.#wireframeColor =
			properties.wireframeColor ??
			this.#settings.wireframeColor ??
			(this.#settings.points.color_1 as string);
		this.#snapToVertices = properties.snapToVertices ?? true;
		this.#snapToEdges = properties.snapToEdges ?? true;
		this.#snapToFaces = properties.snapToFaces ?? true;
		this.#snapToVerticesRadius = properties.snapToVerticesRadius;
		this.#snapToEdgesRadius = properties.snapToEdgesRadius;

		this.#sceneBoundingSphereRadius =
			sceneTree.root.boundingBox.boundingSphere.radius;
		this.updateIntersectionThresholds();
		this.#eventEngine.addListener(
			EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE,
			(e) => {
				const event = e as ISceneEvent;
				if (event.viewportId === this.#viewport.id) {
					const boundingBox = new Box(
						event.boundingBox!.min,
						event.boundingBox!.max,
					);
					this.#sceneBoundingSphereRadius =
						boundingBox.boundingSphere.radius;
					this.updateIntersectionThresholds();
				}
			},
		);

		this.updateNodes(properties.nodes);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (8)

	public get nodes(): ITreeNode[] {
		return this.#nodes;
	}

	public get snapRestrictions(): {[key: string]: ISnapRestriction} {
		return this.#snapRestrictions;
	}

	public get snapToEdges(): boolean {
		return this.#snapToEdges;
	}

	public set snapToEdges(value: boolean) {
		this.#snapToEdges = value;
	}

	public get snapToFaces(): boolean {
		return this.#snapToFaces;
	}

	public set snapToFaces(value: boolean) {
		this.#snapToFaces = value;
	}

	public get snapToVertices(): boolean {
		return this.#snapToVertices;
	}

	public set snapToVertices(value: boolean) {
		this.#snapToVertices = value;
	}

	// #endregion Public Getters And Setters (8)

	// #region Public Methods (3)

	public rayTrace(
		ray: IRay,
		metaData?: RestrictionMetaData,
	): RestrictionResult | undefined {
		if (this.enabled === false) return;
		if (
			this.#snapToVertices === false &&
			this.#snapToEdges === false &&
			this.#snapToFaces === false
		)
			return;

		// assign raycaster parameters
		this.#raycaster.params = this.#rayCasterParams;

		this.#raycaster.ray.direction.set(
			ray.direction[0],
			ray.direction[1],
			ray.direction[2],
		);
		this.#raycaster.ray.origin.set(
			ray.origin[0],
			ray.origin[1],
			ray.origin[2],
		);

		// intersect all nodes
		let intersections: THREE.Intersection[] = [];
		this.#nodes.forEach((node) => {
			const threeJsObject = node.convertedObject[
				this.#viewport.id
			] as THREE.Object3D;
			if (threeJsObject) {
				const currentIntersections =
					this.#raycaster.intersectObject(threeJsObject);
				intersections = intersections.concat(currentIntersections);
			}
		});

		// sort
		intersections.sort((a, b) => a.distance - b.distance);

		// return first intersection
		if (intersections.length > 0) {
			const object = intersections[0].object as THREE.Mesh;

			let geometryRestrictionIntersectionData:
				| GeometryRestrictionIntersectionData
				| undefined;

			// search the three.js object hierarchy for the converted object
			let tempObject = object as unknown as SDObject;
			while (tempObject.parent) {
				const intersectedNode = this.#nodes.find(
					(node) =>
						node.id === tempObject.SDid &&
						node.version === tempObject.SDversion,
				);
				if (intersectedNode) {
					// from this node, we can get the geometry data
					intersectedNode.traverseData((d) => {
						if (
							d instanceof GeometryData &&
							d.id === (object.parent as SDObject).SDid &&
							d.version === (object.parent as SDObject).SDversion
						) {
							geometryRestrictionIntersectionData = {
								node: intersectedNode,
								geometryData: d,
							};
						}
					});
					break;
				}

				tempObject = tempObject.parent as unknown as SDObject;
			}

			const geometry = object.geometry;
			const positionAttribute = geometry.getAttribute("position");

			if (
				object instanceof THREE.Points &&
				intersections[0].index !== undefined
			) {
				if (!this.#snapToVertices) return;
				const vertex = new THREE.Vector3();
				vertex.fromBufferAttribute(
					positionAttribute,
					intersections[0].index,
				);
				object.localToWorld(vertex);

				return this.constructRestrictionResult(
					vec3.fromValues(vertex.x, vertex.y, vertex.z),
					intersections[0].distance,
					intersections[0].pointOnLine,
					geometryRestrictionIntersectionData,
				);
			}

			const intersectionPoint = intersections[0].point;
			const intersectionPointVec3 = vec3.fromValues(
				intersectionPoint.x,
				intersectionPoint.y,
				intersectionPoint.z,
			);

			if (!intersections[0].face)
				return this.constructRestrictionResult(
					intersectionPointVec3,
					intersections[0].distance,
					intersections[0].pointOnLine,
					geometryRestrictionIntersectionData,
				);

			if (this.#snapToVertices === true || this.#snapToEdges === true) {
				const vertexA = new THREE.Vector3();
				vertexA.fromBufferAttribute(
					positionAttribute,
					intersections[0].face!.a,
				);
				object.localToWorld(vertexA);
				const vertexAVec3 = vec3.fromValues(
					vertexA.x,
					vertexA.y,
					vertexA.z,
				);

				const vertexB = new THREE.Vector3();
				vertexB.fromBufferAttribute(
					positionAttribute,
					intersections[0].face!.b,
				);
				object.localToWorld(vertexB);
				const vertexBVec3 = vec3.fromValues(
					vertexB.x,
					vertexB.y,
					vertexB.z,
				);

				const vertexC = new THREE.Vector3();
				vertexC.fromBufferAttribute(
					positionAttribute,
					intersections[0].face!.c,
				);
				object.localToWorld(vertexC);
				const vertexCVec3 = vec3.fromValues(
					vertexC.x,
					vertexC.y,
					vertexC.z,
				);

				if (this.#snapToVertices === true) {
					const distanceA = this.checkDistance(
						intersectionPointVec3,
						vertexAVec3,
						this.#snapToVerticesRadius,
					);
					const distanceB = this.checkDistance(
						intersectionPointVec3,
						vertexBVec3,
						this.#snapToVerticesRadius,
					);
					const distanceC = this.checkDistance(
						intersectionPointVec3,
						vertexCVec3,
						this.#snapToVerticesRadius,
					);

					// part 1 - check if the intersection point is close to a vertex
					if (
						distanceA.check &&
						distanceA.distanceSquared < distanceB.distanceSquared &&
						distanceA.distanceSquared < distanceC.distanceSquared
					) {
						return this.constructRestrictionResult(
							vertexAVec3,
							intersections[0].distance,
							intersections[0].pointOnLine,
							geometryRestrictionIntersectionData,
						);
					} else if (
						distanceB.check &&
						distanceB.distanceSquared < distanceA.distanceSquared &&
						distanceB.distanceSquared < distanceC.distanceSquared
					) {
						return this.constructRestrictionResult(
							vertexBVec3,
							intersections[0].distance,
							intersections[0].pointOnLine,
							geometryRestrictionIntersectionData,
						);
					} else if (
						distanceC.check &&
						distanceC.distanceSquared < distanceA.distanceSquared &&
						distanceC.distanceSquared < distanceB.distanceSquared
					) {
						return this.constructRestrictionResult(
							vertexCVec3,
							intersections[0].distance,
							intersections[0].pointOnLine,
							geometryRestrictionIntersectionData,
						);
					}
				}

				if (this.#snapToEdges === true) {
					// part 2 - check if the intersection point is close to an edge

					// create the closest points on the edges
					const closestPointOnEdgeAB =
						this.#geometryMathManager.closestPointOnLine(
							vertexAVec3,
							vertexBVec3,
							intersectionPointVec3,
						);
					const closestPointOnEdgeBC =
						this.#geometryMathManager.closestPointOnLine(
							vertexBVec3,
							vertexCVec3,
							intersectionPointVec3,
						);
					const closestPointOnEdgeCA =
						this.#geometryMathManager.closestPointOnLine(
							vertexCVec3,
							vertexAVec3,
							intersectionPointVec3,
						);

					// create the distances
					const distanceAB = this.checkDistance(
						intersectionPointVec3,
						closestPointOnEdgeAB,
						this.#snapToEdgesRadius,
					);
					const distanceBC = this.checkDistance(
						intersectionPointVec3,
						closestPointOnEdgeBC,
						this.#snapToEdgesRadius,
					);
					const distanceCA = this.checkDistance(
						intersectionPointVec3,
						closestPointOnEdgeCA,
						this.#snapToEdgesRadius,
					);

					// check if the intersection point is close to an edge
					if (
						distanceAB.check &&
						distanceAB.distanceSquared <
							distanceBC.distanceSquared &&
						distanceAB.distanceSquared < distanceCA.distanceSquared
					) {
						return this.constructRestrictionResult(
							closestPointOnEdgeAB,
							intersections[0].distance,
							intersections[0].pointOnLine,
							geometryRestrictionIntersectionData,
						);
					} else if (
						distanceBC.check &&
						distanceBC.distanceSquared <
							distanceAB.distanceSquared &&
						distanceBC.distanceSquared < distanceCA.distanceSquared
					) {
						return this.constructRestrictionResult(
							closestPointOnEdgeBC,
							intersections[0].distance,
							intersections[0].pointOnLine,
							geometryRestrictionIntersectionData,
						);
					} else if (
						distanceCA.check &&
						distanceCA.distanceSquared <
							distanceAB.distanceSquared &&
						distanceCA.distanceSquared < distanceBC.distanceSquared
					) {
						return this.constructRestrictionResult(
							closestPointOnEdgeCA,
							intersections[0].distance,
							intersections[0].pointOnLine,
							geometryRestrictionIntersectionData,
						);
					}
				}
			}

			if (this.#snapToFaces === true) {
				// part 3 - face intersection
				return this.constructRestrictionResult(
					vec3.fromValues(
						intersectionPoint.x,
						intersectionPoint.y,
						intersectionPoint.z,
					),
					intersections[0].distance,
					undefined,
					geometryRestrictionIntersectionData,
				);
			}
		}

		return;
	}

	public updateNodes(nodes: ITreeNode[]) {
		this.#nodes = nodes;

		if (this.#wireframe) {
			this.#visualizationObject.traverse((object) => {
				if (object instanceof THREE.LineSegments) {
					object.geometry.dispose();
					object.material.dispose();
				}
			});
			this._object3D.remove(this.#visualizationObject);

			this.#visualizationObject = new THREE.Object3D();
			this.#nodes.forEach((node) => {
				const threeJsObject = node.convertedObject[
					this.#viewport.id
				] as THREE.Object3D;
				if (threeJsObject) {
					let parent = threeJsObject.parent;
					while (parent) {
						parent.updateMatrixWorld(true);
						parent = parent.parent;
					}
					threeJsObject.updateMatrixWorld(true);
					threeJsObject.traverse((object) => {
						if (object instanceof THREE.Mesh) {
							const wireframe = new THREE.WireframeGeometry(
								object.geometry,
							);
							const line = new THREE.LineSegments(
								wireframe,
								new THREE.LineBasicMaterial({
									color: new THREE.Color(
										this.#wireframeColor,
									),
								}),
							);
							line.matrix.copy(object.matrixWorld);
							line.matrixAutoUpdate = false;
							this.#visualizationObject.add(line);
						}
					});
				}
			});
			this._object3D.add(this.#visualizationObject);
		}
	}

	// #endregion Public Methods (3)

	// #region Protected Methods (1)

	protected visibilityChanged(): void {}

	// #endregion Protected Methods (1)

	// #region Private Methods (1)

	private updateIntersectionThresholds(): void {
		this.#rayCasterParams.Points.threshold =
			this.#sceneBoundingSphereRadius * this.#pointIntersectionPercentage;
		this.#rayCasterParams.Line.threshold =
			this.#sceneBoundingSphereRadius * this.#lineIntersectionPercentage;
		this.#rayCasterParams.Line2!.threshold =
			this.#sceneBoundingSphereRadius * this.#lineIntersectionPercentage;
	}

	private constructRestrictionResult(
		targetPoint: vec3,
		distanceOriginToClosestIntersectionPoint: number,
		closestPointOnRay?: THREE.Vector3,
		geometryRestrictionIntersectionData?: GeometryRestrictionIntersectionData,
	): RestrictionResult {
		const closestPointOnRayVec3 = closestPointOnRay
			? vec3.fromValues(
					closestPointOnRay.x,
					closestPointOnRay.y,
					closestPointOnRay.z,
				)
			: targetPoint;
		return {
			closestIntersectionPoint: closestPointOnRay
				? vec3.fromValues(
						closestPointOnRay.x,
						closestPointOnRay.y,
						closestPointOnRay.z,
					)
				: targetPoint,
			distanceOriginToClosestIntersectionPointSquared:
				distanceOriginToClosestIntersectionPoint *
				distanceOriginToClosestIntersectionPoint,
			targetPoint,
			distanceClosestPointToTargetPointSquared:
				closestPointOnRayVec3 !== targetPoint
					? vec3.sqrDist(closestPointOnRayVec3, targetPoint)
					: 0,
			restriction: this,
			restrictionIntersectionData: geometryRestrictionIntersectionData,
		};
	}

	/**
	 * We check the distance between two points.
	 * If a radius is given, we check if the distance is smaller than the radius.
	 * If no radius is given, we move to the screen space distance check.
	 *
	 * @param point1
	 * @param point2
	 * @param radius
	 * @returns
	 */
	private checkDistance(
		point1: vec3,
		point2: vec3,
		radius?: number,
	): {
		distanceSquared: number;
		check: boolean;
	} {
		if (radius !== undefined) {
			const distance = vec3.sqrDist(point1, point2);
			return {
				distanceSquared: distance * distance,
				check: distance < radius,
			};
		} else {
			return this.#geometryMathManager.screenSpaceDistanceCheck(
				point1,
				point2,
				this.#settings.points.size_0! *
					this.#settings.distanceMultiplicationFactor,
			);
		}
	}

	// #endregion Private Methods (1)
}

// #endregion Classes (1)
