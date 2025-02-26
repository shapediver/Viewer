import * as THREE from 'three';
import { AbstractSnapRestriction } from '../../AbstractSnapRestriction';
import {
    Box,
    ITreeNode,
    IViewportApi,
    sceneTree
} from '@shapediver/viewer';
import { GeometryMathManager } from '../../../GeometryMathManager';
import { IRay } from '@shapediver/viewer.shared.types';
import { ISnapRestriction, SnapRestrictionProperties } from '../../../../interfaces/ISnapRestriction';
import { PlaneRestriction } from '../PlaneRestriction';
import { RestrictionMetaData, RestrictionResult } from '../../../../interfaces/IRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type AxisRestrictionProperties = {
    activationKeyX?: string;
    activationKeyY?: string;
    activationKeyZ?: string;
    activationKeyPlane?: string;
} & SnapRestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class AxisRestriction extends AbstractSnapRestriction implements ISnapRestriction {
    // #region Properties (9)

    readonly #activationKeyPlane: string;
    readonly #activationKeyX: string;
    readonly #activationKeyY: string;
    readonly #activationKeyZ: string;
    readonly #planeRestriction: PlaneRestriction;

    #active: boolean = false;
    #axesHelper?: THREE.AxesHelper;
    #geometryMathManager: GeometryMathManager;
    #priority: number = 0;

    // #endregion Properties (9)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, geometryMathManager: GeometryMathManager, parentNode: ITreeNode, planeRestriction: PlaneRestriction, properties?: AxisRestrictionProperties) {
        super(viewport, parentNode, 'axis');
        this.#planeRestriction = planeRestriction;
        this.#geometryMathManager = geometryMathManager;

        this.#activationKeyX = properties?.activationKeyX || 'x';
        this.#activationKeyY = properties?.activationKeyY || 'y';
        this.#activationKeyZ = properties?.activationKeyZ || 'z';
        this.#activationKeyPlane = properties?.activationKeyPlane || 'p';

        this.#priority = properties?.priority || 1;

        // create the axes visualization
        this.createAxesVisualization();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (5)

    public get active(): boolean {
        return this.#active;
    }

    public set active(value: boolean) {
        this.#active = value;

        if (this.#axesHelper) this.#axesHelper.visible = value;
    }

    public get enabledEditable(): boolean {
        return this._enabledEditable;
    }

    public get priority(): number {
        return this.#priority;
    }

    public set priority(value: number) {
        this.#priority = value;
    }

    // #endregion Public Getters And Setters (5)

    // #region Public Methods (2)

    public snap(ray: IRay, point: vec3, distance: number, metaData?: RestrictionMetaData): RestrictionResult | undefined {
        if (this.enabled === false) return;
        if (!metaData || !metaData.startPoint) return;

        const xPressed = (metaData?.pressedKeys?.length === 1 && metaData?.pressedKeys[0] === this.#activationKeyX);
        const yPressed = (metaData?.pressedKeys?.length === 1 && metaData?.pressedKeys[0] === this.#activationKeyY);
        const zPressed = (metaData?.pressedKeys?.length === 1 && metaData?.pressedKeys[0] === this.#activationKeyZ);
        const pPressed = (metaData?.pressedKeys?.length === 1 && metaData?.pressedKeys[0] === this.#activationKeyPlane);

        // we move the axes helper to the reference point
        if (this.#axesHelper && (xPressed || yPressed || zPressed)) {
            this.#axesHelper.position.copy(new THREE.Vector3(metaData.startPoint[0], metaData.startPoint[1], metaData.startPoint[2]));
            this.#axesHelper.visible = false;
        }

        if (xPressed) {
            const snappedPoint = this.#geometryMathManager.closestPoint({ origin: metaData.startPoint, direction: this.#planeRestriction.vectorU }, point);
            const closestPointOnRay = this.#geometryMathManager.closestPoint(ray, snappedPoint);
            return { targetPoint: snappedPoint, closestIntersectionPoint: closestPointOnRay, distanceOriginToClosestIntersectionPointSquared: vec3.sqrDist(ray.origin, closestPointOnRay), distanceClosestPointToTargetPointSquared: vec3.sqrDist(snappedPoint, closestPointOnRay), restriction: this.#planeRestriction, snapRestriction: this };
        } else if (yPressed) {
            const snappedPoint = this.#geometryMathManager.closestPoint({ origin: metaData.startPoint, direction: this.#planeRestriction.vectorV }, point);
            const closestPointOnRay = this.#geometryMathManager.closestPoint(ray, snappedPoint);
            return { targetPoint: snappedPoint, closestIntersectionPoint: closestPointOnRay, distanceOriginToClosestIntersectionPointSquared: vec3.sqrDist(ray.origin, closestPointOnRay), distanceClosestPointToTargetPointSquared: vec3.sqrDist(snappedPoint, closestPointOnRay), restriction: this.#planeRestriction, snapRestriction: this };
        } else if (zPressed) {
            const snappedPoint = this.#geometryMathManager.closestPointsRayRay({ origin: metaData.startPoint, direction: this.#planeRestriction.normal }, ray).closestPointOnRay1;
            const closestPointOnRay = this.#geometryMathManager.closestPoint(ray, snappedPoint);
            return { targetPoint: snappedPoint, closestIntersectionPoint: closestPointOnRay, distanceOriginToClosestIntersectionPointSquared: vec3.sqrDist(ray.origin, closestPointOnRay), distanceClosestPointToTargetPointSquared: vec3.sqrDist(snappedPoint, closestPointOnRay), restriction: this.#planeRestriction, snapRestriction: this };
        } else if (pPressed) {
            const snappedPoint = this.#geometryMathManager.closestPointOnPlane(this.#planeRestriction.origin, this.#planeRestriction.normal, point);
            const closestPointOnRay = this.#geometryMathManager.closestPoint(ray, snappedPoint);
            return { targetPoint: snappedPoint, closestIntersectionPoint: closestPointOnRay, distanceOriginToClosestIntersectionPointSquared: vec3.sqrDist(ray.origin, closestPointOnRay), distanceClosestPointToTargetPointSquared: vec3.sqrDist(snappedPoint, closestPointOnRay), restriction: this.#planeRestriction, snapRestriction: this };
        }
    }

    public updatePlaneDefinition(): void {
        this.createAxesVisualization();
    }

    // #endregion Public Methods (2)

    // #region Protected Methods (1)

    protected visibilityChanged(visible: boolean): void {
        if (visible === false) {
            if (this.#axesHelper) {
                this.#axesHelper.visible = false;
            }
        }
    }

    // #endregion Protected Methods (1)

    // #region Private Methods (1)

    private createAxesVisualization(): void {
        if (this.#axesHelper) {
            this._object3D.remove(this.#axesHelper);
            this.#axesHelper.dispose();
        }

        const bb = new Box();
        for (let i = 0; i < sceneTree.root.children.length; i++) {
            if ((sceneTree.root.children[i] as unknown as { sessionNode?: boolean }).sessionNode === true) {
                bb.union(sceneTree.root.children[i].boundingBox);
            }
        }

        const radius = bb.boundingSphere.radius;

        this.#axesHelper = new THREE.AxesHelper(radius);
        this.#axesHelper.position.copy(new THREE.Vector3(this.#planeRestriction.origin[0], this.#planeRestriction.origin[1], this.#planeRestriction.origin[2]));
        this.#axesHelper.visible = false;

        this.#axesHelper.renderOrder = 100;
        (this.#axesHelper.material as THREE.LineBasicMaterial).depthTest = false;
        (this.#axesHelper.material as THREE.LineBasicMaterial).transparent = true;

        // three.js uses a right-handed coordinate system, so we need to rotate the axes helper
        const rotationMatrix = new THREE.Matrix4().fromArray([
            this.#planeRestriction.vectorU[0], this.#planeRestriction.vectorU[1], this.#planeRestriction.vectorU[2], 0,
            this.#planeRestriction.vectorV[0], this.#planeRestriction.vectorV[1], this.#planeRestriction.vectorV[2], 0,
            this.#planeRestriction.normal[0], this.#planeRestriction.normal[1], this.#planeRestriction.normal[2], 0,
            0, 0, 0, 1
        ]);

        this.#axesHelper.rotation.setFromRotationMatrix(rotationMatrix);

        this._object3D.add(this.#axesHelper);
    }

    // #endregion Private Methods (1)
}

// #endregion Classes (1)
