import * as THREE from 'three';
import { AbstractRestriction } from '../AbstractRestriction';
import { DrawingToolsManager } from '../../../../DrawingToolsManager';
import { GeometryMathManager } from '../../../geometry/GeometryMathManager';
import { IRay, IViewportApi } from '@shapediver/viewer.features.interaction';
import { IRestriction, RestrictionMetaData, RestrictionProperties } from '../../../../../interfaces/IRestriction';
import { ISnapRestriction } from '../../../../../interfaces/ISnapRestriction';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { Settings } from '../../../../../interfaces/IDrawingToolsManager';
import { vec3 } from 'gl-matrix';

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
    // #region Properties (10)

    readonly #raycaster = new THREE.Raycaster();
    readonly #viewport: IViewportApi;

    #geometryMathManager: GeometryMathManager;
    #nodes: ITreeNode[] = [];
    #settings: Settings;
    #snapRestrictions: { [key: string]: ISnapRestriction; } = {};
    #snapToEdges: boolean = true;
    #snapToFaces: boolean = true;
    #snapToVertices: boolean = true;
    #visualizationObject: THREE.Object3D = new THREE.Object3D();
    #wireframe: boolean;
    #wireframeColor: string;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string, properties: GeometryRestrictionProperties) {
        super(drawingToolsManager, id);
        this.#viewport = drawingToolsManager.viewport;
        this.#settings = drawingToolsManager.settings;
        this.#geometryMathManager = drawingToolsManager.geometryMathManager;
        this.#wireframe = properties.wireframe ?? true;
        this.#wireframeColor = properties.wireframeColor ?? this.#settings.visualization.points.color_1 as string;

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

    // #region Public Methods (2)

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): vec3 | undefined {
        if (this.enabled === false) return;
        if (this.#snapToVertices === false && this.#snapToEdges === false && this.#snapToFaces === false) return;

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
            const intersectionPoint = intersections[0].point;
            const intersectionPointVec3 = vec3.fromValues(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);

            if (!intersections[0].face) return vec3.fromValues(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);

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
                    const distanceA = this.#geometryMathManager.screenSpaceDistanceCheck(intersectionPointVec3, vertexAVec3, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor);
                    const distanceB = this.#geometryMathManager.screenSpaceDistanceCheck(intersectionPointVec3, vertexBVec3, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor);
                    const distanceC = this.#geometryMathManager.screenSpaceDistanceCheck(intersectionPointVec3, vertexCVec3, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor);

                    // part 1 - check if the intersection point is close to a vertex
                    if (distanceA.check && distanceA.distanceSquared < distanceB.distanceSquared && distanceA.distanceSquared < distanceC.distanceSquared) {
                        return vec3.fromValues(vertexA.x, vertexA.y, vertexA.z);
                    } else if (distanceB.check && distanceB.distanceSquared < distanceA.distanceSquared && distanceB.distanceSquared < distanceC.distanceSquared) {
                        return vec3.fromValues(vertexB.x, vertexB.y, vertexB.z);
                    } else if (distanceC.check && distanceC.distanceSquared < distanceA.distanceSquared && distanceC.distanceSquared < distanceB.distanceSquared) {
                        return vec3.fromValues(vertexC.x, vertexC.y, vertexC.z);
                    }
                }

                if (this.#snapToEdges === true) {
                    // part 2 - check if the intersection point is close to an edge

                    // create the closest points on the edges
                    const closestPointOnEdgeAB = this.#geometryMathManager.closestPointOnLine(vertexAVec3, vertexBVec3, intersectionPointVec3);
                    const closestPointOnEdgeBC = this.#geometryMathManager.closestPointOnLine(vertexBVec3, vertexCVec3, intersectionPointVec3);
                    const closestPointOnEdgeCA = this.#geometryMathManager.closestPointOnLine(vertexCVec3, vertexAVec3, intersectionPointVec3);

                    // create the distances
                    const distanceAB = this.#geometryMathManager.screenSpaceDistanceCheck(intersectionPointVec3, closestPointOnEdgeAB, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor);
                    const distanceBC = this.#geometryMathManager.screenSpaceDistanceCheck(intersectionPointVec3, closestPointOnEdgeBC, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor);
                    const distanceCA = this.#geometryMathManager.screenSpaceDistanceCheck(intersectionPointVec3, closestPointOnEdgeCA, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor);

                    // check if the intersection point is close to an edge
                    if (distanceAB.check && distanceAB.distanceSquared < distanceBC.distanceSquared && distanceAB.distanceSquared < distanceCA.distanceSquared) {
                        return closestPointOnEdgeAB;
                    } else if (distanceBC.check && distanceBC.distanceSquared < distanceAB.distanceSquared && distanceBC.distanceSquared < distanceCA.distanceSquared) {
                        return closestPointOnEdgeBC;
                    } else if (distanceCA.check && distanceCA.distanceSquared < distanceAB.distanceSquared && distanceCA.distanceSquared < distanceBC.distanceSquared) {
                        return closestPointOnEdgeCA;
                    }
                }
            }

            if (this.#snapToFaces === true) {
                // part 3 - face intersection
                return vec3.fromValues(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);
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

    // #endregion Public Methods (2)

    // #region Protected Methods (1)

    protected visibilityChanged(): void { }

    // #endregion Protected Methods (1)
}

// #endregion Classes (1)
