import * as THREE from 'three';
import { AbstractRestriction } from '../AbstractRestriction';
import { Box } from '@shapediver/viewer.shared.math';
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services';
import { GeometryMathManager } from '../../GeometryMathManager';
import { IIntersection, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import {
    IRestriction,
    RayTraceResult,
    RESTRICTION_TYPE,
    RestrictionMetaData,
    RestrictionProperties
} from '../../../interfaces/IRestriction';
import { ISceneEvent } from '@shapediver/viewer.shared.types';
import { ISnapRestriction } from '../../../interfaces/ISnapRestriction';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { IViewportApi, sceneTree } from '@shapediver/viewer';
import { IVisualizationSettings } from '../../../interfaces/IVisualizationSettings';
import { mat4, vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type GeometryRestrictionProperties = {
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
} & RestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class GeometryRestriction extends AbstractRestriction implements IRestriction {
    // #region Properties (17)

    readonly #eventEngine: EventEngine = EventEngine.instance;
    readonly #rayCasterParams: THREE.RaycasterParameters = {
        Line: { threshold: 1 },
        Line2: { threshold: 1 },
        Points: { threshold: 1 },
        Mesh: {},
        LOD: {},
        Sprite: {}
    };
    readonly #raycaster = new THREE.Raycaster();
    readonly #viewport: IViewportApi;

    #geometryMathManager: GeometryMathManager;
    #lineIntersectionPercentage: number = 0.025;
    #nodes: ITreeNode[] = [];
    #pointIntersectionPercentage: number = 0.025;
    #sceneBoundingSphereRadius: number = 0;
    #settings: IVisualizationSettings;
    #snapRestrictions: { [key: string]: ISnapRestriction; } = {};
    #snapToEdges: boolean = true;
    #snapToFaces: boolean = true;
    #snapToVertices: boolean = true;
    #visualizationObject: THREE.Object3D = new THREE.Object3D();
    #wireframe: boolean;
    #wireframeColor: string;

    // #endregion Properties (17)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, geometryMathManager: GeometryMathManager, parentNode: ITreeNode, id: string, settings: IVisualizationSettings, properties: GeometryRestrictionProperties) {
        super(viewport, parentNode, id, RESTRICTION_TYPE.GEOMETRY);
        this.#viewport = viewport;
        this.#settings = settings;
        this.#geometryMathManager = geometryMathManager;
        this.#wireframe = properties.wireframe ?? true;
        this.#wireframeColor = properties.wireframeColor ?? this.#settings.points.color_1 as string;

        this.#sceneBoundingSphereRadius = sceneTree.root.boundingBox.boundingSphere.radius;
        this.updateIntersectionThresholds();
        this.#eventEngine.addListener(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, (e) => {
            const event = e as ISceneEvent;
            if (event.viewportId === this.#viewport.id) {
                const boundingBox = new Box(event.boundingBox!.min, event.boundingBox!.max);
                this.#sceneBoundingSphereRadius = boundingBox.boundingSphere.radius;
                this.updateIntersectionThresholds();
            }
        });

        this.updateNodes(properties.nodes);
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (8)

    public get priority(): number {
        return 0;
    }

    public get snapRestrictions(): { [key: string]: ISnapRestriction; } {
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

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): RayTraceResult | undefined {
        if (this.enabled === false) return;
        if (this.#snapToVertices === false && this.#snapToEdges === false && this.#snapToFaces === false) return;

        // assign raycaster parameters
        this.#raycaster.params = this.#rayCasterParams;

        this.#raycaster.ray.direction.set(ray.direction[0], ray.direction[1], ray.direction[2]);
        this.#raycaster.ray.origin.set(ray.origin[0], ray.origin[1], ray.origin[2]);

        // intersect all nodes
        let intersections: THREE.Intersection[] = [];
        this.#nodes.forEach(node => {
            const threeJsObject = node.convertedObject[this.#viewport.id] as THREE.Object3D;
            if (threeJsObject) {
                const currentIntersections = this.#raycaster.intersectObject(threeJsObject);
                intersections = intersections.concat(currentIntersections);
            }
        });

        // sort
        intersections.sort((a, b) => a.distance - b.distance);

        // return first intersection
        if (intersections.length > 0) {
            const object = intersections[0].object as THREE.Mesh;
            const geometry = object.geometry;
            const positionAttribute = geometry.getAttribute('position');

            if (object instanceof THREE.Points && intersections[0].index !== undefined) {
                if (!this.#snapToVertices) return;
                const vertex = new THREE.Vector3();
                vertex.fromBufferAttribute(positionAttribute, intersections[0].index);
                object.localToWorld(vertex);

                return { point: vec3.fromValues(vertex.x, vertex.y, vertex.z), restriction: this };
            }

            const intersectionPoint = intersections[0].point;
            const intersectionPointVec3 = vec3.fromValues(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);

            if (!intersections[0].face) return { point: intersectionPointVec3, restriction: this };

            if (this.#snapToVertices === true || this.#snapToEdges === true) {
                const vertexA = new THREE.Vector3();
                vertexA.fromBufferAttribute(positionAttribute, intersections[0].face!.a);
                object.localToWorld(vertexA);
                const vertexAVec3 = vec3.fromValues(vertexA.x, vertexA.y, vertexA.z);

                const vertexB = new THREE.Vector3();
                vertexB.fromBufferAttribute(positionAttribute, intersections[0].face!.b);
                object.localToWorld(vertexB);
                const vertexBVec3 = vec3.fromValues(vertexB.x, vertexB.y, vertexB.z);

                const vertexC = new THREE.Vector3();
                vertexC.fromBufferAttribute(positionAttribute, intersections[0].face!.c);
                object.localToWorld(vertexC);
                const vertexCVec3 = vec3.fromValues(vertexC.x, vertexC.y, vertexC.z);

                if (this.#snapToVertices === true) {
                    const distanceA = this.#geometryMathManager.screenSpaceDistanceCheck(intersectionPointVec3, vertexAVec3, this.#settings.points.size_0! * this.#settings.distanceMultiplicationFactor);
                    const distanceB = this.#geometryMathManager.screenSpaceDistanceCheck(intersectionPointVec3, vertexBVec3, this.#settings.points.size_0! * this.#settings.distanceMultiplicationFactor);
                    const distanceC = this.#geometryMathManager.screenSpaceDistanceCheck(intersectionPointVec3, vertexCVec3, this.#settings.points.size_0! * this.#settings.distanceMultiplicationFactor);

                    // part 1 - check if the intersection point is close to a vertex
                    if (distanceA.check && distanceA.distanceSquared < distanceB.distanceSquared && distanceA.distanceSquared < distanceC.distanceSquared) {
                        return { point: vertexAVec3, restriction: this };
                    } else if (distanceB.check && distanceB.distanceSquared < distanceA.distanceSquared && distanceB.distanceSquared < distanceC.distanceSquared) {
                        return { point: vertexBVec3, restriction: this };
                    } else if (distanceC.check && distanceC.distanceSquared < distanceA.distanceSquared && distanceC.distanceSquared < distanceB.distanceSquared) {
                        return { point: vertexCVec3, restriction: this };
                    }
                }

                if (this.#snapToEdges === true) {
                    // part 2 - check if the intersection point is close to an edge

                    // create the closest points on the edges
                    const closestPointOnEdgeAB = this.#geometryMathManager.closestPointOnLine(vertexAVec3, vertexBVec3, intersectionPointVec3);
                    const closestPointOnEdgeBC = this.#geometryMathManager.closestPointOnLine(vertexBVec3, vertexCVec3, intersectionPointVec3);
                    const closestPointOnEdgeCA = this.#geometryMathManager.closestPointOnLine(vertexCVec3, vertexAVec3, intersectionPointVec3);

                    // create the distances
                    const distanceAB = this.#geometryMathManager.screenSpaceDistanceCheck(intersectionPointVec3, closestPointOnEdgeAB, this.#settings.points.size_0! * this.#settings.distanceMultiplicationFactor);
                    const distanceBC = this.#geometryMathManager.screenSpaceDistanceCheck(intersectionPointVec3, closestPointOnEdgeBC, this.#settings.points.size_0! * this.#settings.distanceMultiplicationFactor);
                    const distanceCA = this.#geometryMathManager.screenSpaceDistanceCheck(intersectionPointVec3, closestPointOnEdgeCA, this.#settings.points.size_0! * this.#settings.distanceMultiplicationFactor);

                    // check if the intersection point is close to an edge
                    if (distanceAB.check && distanceAB.distanceSquared < distanceBC.distanceSquared && distanceAB.distanceSquared < distanceCA.distanceSquared) {
                        return { point: closestPointOnEdgeAB, restriction: this };
                    } else if (distanceBC.check && distanceBC.distanceSquared < distanceAB.distanceSquared && distanceBC.distanceSquared < distanceCA.distanceSquared) {
                        return { point: closestPointOnEdgeBC, restriction: this };
                    } else if (distanceCA.check && distanceCA.distanceSquared < distanceAB.distanceSquared && distanceCA.distanceSquared < distanceBC.distanceSquared) {
                        return { point: closestPointOnEdgeCA, restriction: this };
                    }
                }
            }

            if (this.#snapToFaces === true) {
                // part 3 - face intersection
                return { point: vec3.fromValues(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z), restriction: this };
            }
        }

        return;
    }

    public setup(node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4, dragOrigin?: vec3): RayTraceResult | undefined {
        return this.rayTrace(ray);
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
            this.#nodes.forEach(node => {
                const threeJsObject = node.convertedObject[this.#viewport.id] as THREE.Object3D;
                if (threeJsObject) {
                    threeJsObject.traverse((object) => {
                        if (object instanceof THREE.Mesh) {
                            const wireframe = new THREE.WireframeGeometry(object.geometry);
                            const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: new THREE.Color(this.#wireframeColor) }));
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

    protected visibilityChanged(): void { }

    // #endregion Protected Methods (1)

    // #region Private Methods (1)

    private updateIntersectionThresholds(): void {
        this.#rayCasterParams.Points.threshold = this.#sceneBoundingSphereRadius * this.#pointIntersectionPercentage;
        this.#rayCasterParams.Line.threshold = this.#sceneBoundingSphereRadius * this.#lineIntersectionPercentage;
        this.#rayCasterParams.Line2!.threshold = this.#sceneBoundingSphereRadius * this.#lineIntersectionPercentage;
    }

    // #endregion Private Methods (1)
}

// #endregion Classes (1)
