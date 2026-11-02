import {type IViewportApi, MaterialEngine, sceneTree} from "@shapediver/viewer";
import {SDObject} from "@shapediver/viewer.rendering-engine.rendering-engine-threejs/dist/objects/SDObject";
import {Box} from "@shapediver/viewer.shared.math";
import {
	GeometryData,
	type ITreeNode,
} from "@shapediver/viewer.shared.node-tree";
import {EventEngine, EVENTTYPE} from "@shapediver/viewer.shared.services";
import {
	type IGeometryData,
	type IMapData,
	type IRay,
	type ISceneEvent,
	type IVisualizationSettings,
} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import * as THREE from "three";
import {
	type IRestriction,
	type RestrictionMetaData,
	type RestrictionPropertiesBase,
	type RestrictionResult,
} from "../../../interfaces/IRestriction";
import {type ISnapRestriction} from "../../../interfaces/ISnapRestriction";
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

export interface GeometryRestrictionProperties extends RestrictionPropertiesBase {
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
	 * If the wireframe should be rendered with depth test. (default: false)
	 */
	wireframeDepthTest?: boolean;
	/**
	 * The point size of the wireframe if the geometry contains points. (default: as defined in the viewport settings)
	 */
	wireframePointSize?: number;
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
	/**
	 * The radius in which the restriction should snap. (default: undefined)
	 * Overrides the snapToVerticesRadius and snapToEdgesRadius if defined.
	 *
	 * For a point or line grid this is also the world-space pick radius.
	 */
	radius?: number;
	/**
	 * Spacing of a snap grid, in world units.
	 *
	 * When set, point and line picking covers a whole cell. A radius smaller
	 * than half the cell diagonal otherwise leaves gaps where the cursor
	 * cannot place a point.
	 */
	gridSize?: number;
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
	// #region Properties (21)

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

	#eventListenerToken: string | undefined;
	#geometryMathManager: GeometryMathManager;
	#lineIntersectionPercentage: number = 0.025;
	#nodes: ITreeNode[] = [];
	#pointIntersectionPercentage: number = 0.025;
	#gridSize: number = 0;
	#radius?: number;
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
	#wireframeDepthTest: boolean;
	#wireframePointSize: number;

	// Scratch objects reused across rayTrace() calls to avoid per-frame allocation.
	#scratchVector3A: THREE.Vector3 = new THREE.Vector3();
	#scratchVector3B: THREE.Vector3 = new THREE.Vector3();
	#scratchVector3C: THREE.Vector3 = new THREE.Vector3();
	#scratchIntersections: THREE.Intersection[] = [];

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
		this.#wireframePointSize = properties.wireframePointSize
			? properties.wireframePointSize * this.#viewport.pointSize
			: 10 * this.#viewport.pointSize;
		this.#wireframeDepthTest = properties.wireframeDepthTest ?? true;
		this.#snapToVertices = properties.snapToVertices ?? true;
		this.#snapToEdges = properties.snapToEdges ?? true;
		this.#snapToFaces = properties.snapToFaces ?? true;
		this.#snapToVerticesRadius = properties.snapToVerticesRadius;
		this.#snapToEdgesRadius = properties.snapToEdgesRadius;
		this.#radius = finiteNumber(properties.radius);
		this.#gridSize = finiteNumber(properties.gridSize) ?? 0;

		this.#sceneBoundingSphereRadius =
			sceneTree.root.boundingBox.boundingSphere.radius;
		this.updateIntersectionThresholds();
		this.#eventListenerToken = this.#eventEngine.addListener(
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

		// intersect all nodes — push into reused scratch array instead of concat
		this.#scratchIntersections.length = 0;
		this.#nodes.forEach((node) => {
			const threeJsObject = node.convertedObject[
				this.#viewport.id
			] as THREE.Object3D;
			if (threeJsObject) {
				this.#raycaster.intersectObject(
					threeJsObject,
					true,
					this.#scratchIntersections,
				);
			}
		});

		// sort
		this.#scratchIntersections.sort((a, b) => a.distance - b.distance);

		const intersection = this.leadingIntersection();
		if (intersection) {
			const object = intersection.object as THREE.Mesh;

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
				intersection.index !== undefined
			) {
				if (!this.#snapToVertices) return;
				const vertex = this.#scratchVector3A;
				vertex.fromBufferAttribute(
					positionAttribute,
					intersection.index,
				);
				object.localToWorld(vertex);

				return this.constructRestrictionResult(
					vec3.fromValues(vertex.x, vertex.y, vertex.z),
					intersection.distance,
					intersection.pointOnLine,
					geometryRestrictionIntersectionData,
				);
			}

			const intersectionPoint = intersection.point;
			const intersectionPointVec3 = vec3.fromValues(
				intersectionPoint.x,
				intersectionPoint.y,
				intersectionPoint.z,
			);

			if (!intersection.face)
				return this.constructRestrictionResult(
					intersectionPointVec3,
					intersection.distance,
					intersection.pointOnLine,
					geometryRestrictionIntersectionData,
				);

			if (this.#snapToVertices === true || this.#snapToEdges === true) {
				const vertexA = this.#scratchVector3A;
				vertexA.fromBufferAttribute(
					positionAttribute,
					intersection.face!.a,
				);
				object.localToWorld(vertexA);
				const vertexAVec3 = vec3.fromValues(
					vertexA.x,
					vertexA.y,
					vertexA.z,
				);

				const vertexB = this.#scratchVector3B;
				vertexB.fromBufferAttribute(
					positionAttribute,
					intersection.face!.b,
				);
				object.localToWorld(vertexB);
				const vertexBVec3 = vec3.fromValues(
					vertexB.x,
					vertexB.y,
					vertexB.z,
				);

				const vertexC = this.#scratchVector3C;
				vertexC.fromBufferAttribute(
					positionAttribute,
					intersection.face!.c,
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
						this.#radius ?? this.#snapToVerticesRadius,
					);
					const distanceB = this.checkDistance(
						intersectionPointVec3,
						vertexBVec3,
						this.#radius ?? this.#snapToVerticesRadius,
					);
					const distanceC = this.checkDistance(
						intersectionPointVec3,
						vertexCVec3,
						this.#radius ?? this.#snapToVerticesRadius,
					);

					// part 1 - check if the intersection point is close to a vertex
					if (
						distanceA.check &&
						distanceA.distanceSquared < distanceB.distanceSquared &&
						distanceA.distanceSquared < distanceC.distanceSquared
					) {
						return this.constructRestrictionResult(
							vertexAVec3,
							intersection.distance,
							intersection.pointOnLine,
							geometryRestrictionIntersectionData,
						);
					} else if (
						distanceB.check &&
						distanceB.distanceSquared < distanceA.distanceSquared &&
						distanceB.distanceSquared < distanceC.distanceSquared
					) {
						return this.constructRestrictionResult(
							vertexBVec3,
							intersection.distance,
							intersection.pointOnLine,
							geometryRestrictionIntersectionData,
						);
					} else if (
						distanceC.check &&
						distanceC.distanceSquared < distanceA.distanceSquared &&
						distanceC.distanceSquared < distanceB.distanceSquared
					) {
						return this.constructRestrictionResult(
							vertexCVec3,
							intersection.distance,
							intersection.pointOnLine,
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
						this.#radius ?? this.#snapToEdgesRadius,
					);
					const distanceBC = this.checkDistance(
						intersectionPointVec3,
						closestPointOnEdgeBC,
						this.#radius ?? this.#snapToEdgesRadius,
					);
					const distanceCA = this.checkDistance(
						intersectionPointVec3,
						closestPointOnEdgeCA,
						this.#radius ?? this.#snapToEdgesRadius,
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
							intersection.distance,
							intersection.pointOnLine,
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
							intersection.distance,
							intersection.pointOnLine,
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
							intersection.distance,
							intersection.pointOnLine,
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
					intersection.distance,
					undefined,
					geometryRestrictionIntersectionData,
				);
			}
		}

		return;
	}

	/**
	 * Removes the scene visualization AND cleans up EventEngine listener.
	 */
	public removeVisualization(): void {
		if (this.#eventListenerToken) {
			this.#eventEngine.removeListener(this.#eventListenerToken);
			this.#eventListenerToken = undefined;
		}
		super.removeVisualization();
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
									depthTest: this.#wireframeDepthTest,
									depthWrite: !this.#wireframeDepthTest,
									transparent: true,
								}),
							);
							line.matrix.copy(object.matrixWorld);
							line.renderOrder = 100;
							line.matrixAutoUpdate = false;
							this.#visualizationObject.add(line);
						} else if (object instanceof THREE.Line) {
							const line = new THREE.Line(
								object.geometry,
								new THREE.LineBasicMaterial({
									color: new THREE.Color(
										this.#wireframeColor,
									),
									depthTest: this.#wireframeDepthTest,
									depthWrite: !this.#wireframeDepthTest,
									transparent: true,
								}),
							);
							line.matrix.copy(object.matrixWorld);
							line.renderOrder = 100;
							line.matrixAutoUpdate = false;
							this.#visualizationObject.add(line);
						} else if (object instanceof THREE.Points) {
							const height = this.#viewport.canvas.height;
							const pointSize =
								this.#wireframePointSize * (height / 1080);
							const points = new THREE.Points(
								object.geometry,
								new THREE.PointsMaterial({
									color: new THREE.Color(
										this.#wireframeColor,
									),
									size: pointSize,
									sizeAttenuation: false,
									depthTest: this.#wireframeDepthTest,
									depthWrite: !this.#wireframeDepthTest,
									transparent: true,
									...(pointTexture instanceof THREE.Texture
										? {map: pointTexture}
										: {}),
								}),
							);
							points.matrix.copy(object.matrixWorld);
							points.renderOrder = 100;
							points.matrixAutoUpdate = false;
							this.#visualizationObject.add(points);
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
		const threshold =
			this.pickThreshold() ??
			this.#sceneBoundingSphereRadius * this.#pointIntersectionPercentage;
		const lineThreshold =
			this.pickThreshold() ??
			this.#sceneBoundingSphereRadius * this.#lineIntersectionPercentage;
		this.#rayCasterParams.Points.threshold = threshold;
		this.#rayCasterParams.Line.threshold = lineThreshold;
		this.#rayCasterParams.Line2!.threshold = lineThreshold;
	}

	/**
	 * World-space radius used to pick points and lines.
	 *
	 * An explicit radius wins when it already covers the grid. Otherwise the
	 * radius grows to half a cell diagonal so every cursor position on the
	 * grid resolves to a snap point.
	 */
	private pickThreshold(): number | undefined {
		const radius = this.#radius;
		const gridCoverage =
			this.#gridSize > 0 ? this.#gridSize * Math.SQRT1_2 * 1.01 : 0;
		if (gridCoverage > 0) return Math.max(radius ?? 0, gridCoverage);
		return radius;
	}

	/**
	 * World-space radius used to pick points and lines.
	 * Mesh faces ignore this and use the exact ray.
	 */
	public get pointPickRadius(): number {
		return this.#rayCasterParams.Points.threshold;
	}

	/**
	 * The hit to place against.
	 *
	 * Mesh hits stay in along-ray order. A leading run of point or line hits
	 * is re-ranked by distance to the ray, so a fine grid snaps to the
	 * element under the cursor instead of a neighbor closer to the camera.
	 */
	private leadingIntersection(): THREE.Intersection | undefined {
		const hits = this.#scratchIntersections;
		if (hits.length === 0) return undefined;
		const first = hits[0];
		if (!this.isGridHit(first)) return first;

		// Stay on the near surface. A later hit can sit closer to the ray
		// because it is on the back of the solid, and choosing it makes the
		// whole placement fail the occlusion test.
		const depthBand = Math.max(this.pointPickRadius, 1e-3);
		const maxDistance = first.distance + depthBand;

		let best = first;
		let bestOffset = this.offsetFromRay(first);
		for (let i = 1; i < hits.length; i++) {
			const candidate = hits[i];
			if (!this.isGridHit(candidate)) break;
			if (candidate.distance > maxDistance) break;
			const offset = this.offsetFromRay(candidate);
			if (
				offset < bestOffset ||
				(offset === bestOffset && candidate.distance < best.distance)
			) {
				best = candidate;
				bestOffset = offset;
			}
		}
		return best;
	}

	private isGridHit(hit: THREE.Intersection): boolean {
		return (
			hit.object instanceof THREE.Points ||
			hit.object instanceof THREE.Line
		);
	}

	private offsetFromRay(hit: THREE.Intersection): number {
		// Point hits report the foot on the ray as `point`, so the ray
		// distance has to come from distanceToRay. Line hits report the
		// point on the segment.
		if (hit.object instanceof THREE.Points)
			return hit.distanceToRay ?? Number.POSITIVE_INFINITY;
		return this.#raycaster.ray.distanceToPoint(hit.point);
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

function finiteNumber(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return undefined;
}

// #endregion Classes (1)
