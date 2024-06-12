import THREE from 'three';
import { AbstractRestriction } from '../../AbstractRestriction';
import { CSS2DObject } from '../../../../../../../three/CSS2DRenderer';
import { DrawingToolsManager } from '../../../../../DrawingToolsManager';
import { GeometryMathManager } from '../../../../geometry/GeometryMathManager';
import { IBox } from '@shapediver/viewer';
import { ISnapRestriction, SnapRestrictionProperties } from '../../../../../../interfaces/ISnapRestriction';
import { numberCleaner } from '../../../../../utils/numberCleaner';
import { PlaneRestriction } from '../PlaneRestriction';
import { Settings } from '../../../../../../interfaces/IDrawingToolsManager';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type AngularRestrictionProperties = {
    /**
     * Step size for the angles
     */
    angleStep?: number;

    /**
     * If the angle step is editable for change to the end user.
     * If it is not editable, the angle step cannot be changed from the default value.
     */
    angleStepEditable?: boolean;
} & SnapRestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class AngularRestriction extends AbstractRestriction implements ISnapRestriction {
    // #region Properties (19)

    readonly #activationKey: string;
    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #geometryMathManager: GeometryMathManager;
    readonly #inputBoundingBox: IBox;
    readonly #planeRestriction: PlaneRestriction;
    readonly #settings: Settings;

    #active: boolean = false;
    #activePolarGrids = {
        next: false,
        previous: false
    };
    #angleStep: number;
    #angleStepEditable: boolean = true;
    #angles: number[] = [];
    #labelNext?: CSS2DObject;
    #labelPrevious?: CSS2DObject;
    #normal: vec3;
    #polarGridHelperNext?: THREE.PolarGridHelper;
    #polarGridHelperPrevious?: THREE.PolarGridHelper;
    #priority: number = 0;
    #vectorU: vec3;
    #vectorV: vec3;

    // #endregion Properties (19)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, planeRestriction: PlaneRestriction, properties?: AngularRestrictionProperties) {
        super(drawingToolsManager, 'angular');

        this.#drawingToolsManager = drawingToolsManager;
        this.#geometryMathManager = drawingToolsManager.geometryMathManager;
        this.#inputBoundingBox = drawingToolsManager.inputBoundingBox;
        this.#settings = drawingToolsManager.settings;

        this.#planeRestriction = planeRestriction;

        // we store the properties of the plane restriction
        // as we need them to calculate the transformation matrices
        // and the offset of the grid size to the origin
        this.#vectorU = planeRestriction.vectorU!;
        this.#vectorV = planeRestriction.vectorV!;
        this.#normal = planeRestriction.normal;

        this.#activationKey = properties?.activationKey || 'a';
        this.enabled = properties?.enabled ?? false;
        this._enabledEditable = properties?.enabledEditable ?? true;
        this.#angleStep = properties?.angleStep || Math.PI / 12;
        this.#angleStepEditable = properties?.angleStepEditable ?? true;
        this.#priority = properties?.priority || 0;

        // calculate the angles
        this.calculateAngles();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (8)

    public get active(): boolean {
        return this.#active;
    }

    public set active(value: boolean) {
        this.#active = value;
        if (this.#polarGridHelperNext && this.#activePolarGrids.next === value) this.#polarGridHelperNext.visible = value;
        if (this.#labelNext && this.#activePolarGrids.next === value) this.#labelNext.visible = value;
        if (this.#polarGridHelperPrevious && this.#activePolarGrids.previous === value) this.#polarGridHelperPrevious.visible = value;
        if (this.#labelPrevious && this.#activePolarGrids.previous === value) this.#labelPrevious.visible = value;
    }

    public get angleStep(): number {
        return this.#angleStep;
    }

    public set angleStep(value: number) {
        if (this.#angleStepEditable === false) return;

        this.#angleStep = value;
        this.calculateAngles();
    }

    public get angleStepEditable(): boolean {
        return this.#angleStepEditable;
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

    // #endregion Public Getters And Setters (8)

    // #region Public Methods (2)

    public snap(point: vec3, metaData?: { index?: number }): vec3 | undefined {
        // if the restriction is not enabled OR the activation key is set and the key is not pressed, return
        if (this.enabled === false && this.#drawingToolsManager.keyPressed(this.#activationKey) === false) return;

        if (metaData === undefined || metaData.index === undefined) return;

        if (this.#polarGridHelperNext) {
            this.#polarGridHelperNext.remove(...this.#polarGridHelperNext.children);
            this.#polarGridHelperNext.visible = false;
        }

        if (this.#labelNext) this.#labelNext.visible = false;

        if (this.#polarGridHelperPrevious) {
            this.#polarGridHelperPrevious.remove(...this.#polarGridHelperPrevious.children);
            this.#polarGridHelperPrevious.visible = false;
        }

        if (this.#labelPrevious) this.#labelPrevious.visible = false;

        this.#activePolarGrids = {
            next: false,
            previous: false
        };

        const positionArray = this.#drawingToolsManager.positionArray;

        let previousIndex, nextIndex;
        if (metaData !== undefined && metaData.index !== undefined) {
            previousIndex = metaData.index - 1 < 0 ? positionArray.length / 3 - 1 : metaData.index - 1;
            nextIndex = metaData.index + 1 > positionArray.length / 3 - 1 ? 0 : metaData.index + 1;
        } else {
            // if no index was provided, it is a new point
            previousIndex = positionArray.length / 3 - 1;
            nextIndex = 0;
        }

        if (positionArray.length / 3 < 2) return;

        /**
         * Explanation of the algorithm:
         * 1. Project the point onto the XY-Plane
         * 2. Find the next point and the previous point
         * 3. Project the next and previous point onto the XY-Plane
         * 4. Calculate the angle between the point and the next and previous point
         * 5. Determine which if the angles are in the range to snap to
         *    a. If both are in the range, snap to the intersection of the two lines
         *    b. If only one is in the range, snap to the intersection of the line and the plane
         *    c. If none is in the range, return
         * 6. Reverse the projection to the original coordinate system
         */

        // get the next and previous point from the position array
        const nextPointFromData = vec3.fromValues(positionArray.at((nextIndex * 3))!, positionArray.at((nextIndex * 3) + 1)!, positionArray.at((nextIndex * 3) + 2)!);
        const previousPointFromData = vec3.fromValues(positionArray.at((previousIndex * 3))!, positionArray.at((previousIndex * 3) + 1)!, positionArray.at((previousIndex * 3) + 2)!);

        // project them onto the same plane as the point
        const nextPointProjected = vec3.sub(vec3.create(), nextPointFromData, vec3.scale(vec3.create(), this.#normal, vec3.dot(vec3.sub(vec3.create(), nextPointFromData, point), this.#normal)));
        const previousPointProjected = vec3.sub(vec3.create(), previousPointFromData, vec3.scale(vec3.create(), this.#normal, vec3.dot(vec3.sub(vec3.create(), previousPointFromData, point), this.#normal)));

        // project the point onto the XY-Plane
        const pointProjected = vec3.transformMat4(vec3.create(), point, this.#planeRestriction.transformationToXYPlaneMatrix);
        vec3.transformMat4(nextPointProjected, nextPointProjected, this.#planeRestriction.transformationToXYPlaneMatrix);
        vec3.transformMat4(previousPointProjected, previousPointProjected, this.#planeRestriction.transformationToXYPlaneMatrix);

        // calculate the angle between the next and previous point and the point to restrict on the axis
        const { angularDifference: angularDifferenceNext, crossProduct: crossProductNext, closestAngle: closestAngleNext } = this.getAngularDifference(pointProjected, nextPointProjected);
        const { angularDifference: angularDifferencePrevious, crossProduct: crossProductPrevious, closestAngle: closestAnglePrevious } = this.getAngularDifference(pointProjected, previousPointProjected);

        // calculate the distances in screen space so we can check how close it is
        const resultPointNextAngle = vec3.rotateZ(vec3.create(), pointProjected, nextPointProjected, crossProductNext[2] < 0 ? -angularDifferenceNext : angularDifferenceNext);
        const screenSpaceDistanceCheckNextAngle = this.#geometryMathManager.screenSpaceDistanceCheck(resultPointNextAngle, pointProjected, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor);
        const resultPointPreviousAngle = vec3.rotateZ(vec3.create(), pointProjected, previousPointProjected, crossProductPrevious[2] < 0 ? -angularDifferencePrevious : angularDifferencePrevious);
        const screenSpaceDistanceCheckPreviousAngle = this.#geometryMathManager.screenSpaceDistanceCheck(resultPointPreviousAngle, pointProjected, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor);

        if (screenSpaceDistanceCheckNextAngle.check === false && screenSpaceDistanceCheckPreviousAngle.check === false) return;

        // snap to clear defined point if both distances are smaller than threshold
        if (positionArray.length > 6 && screenSpaceDistanceCheckNextAngle.check === true && screenSpaceDistanceCheckPreviousAngle.check === true) {
            const rayDirectionNext = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), resultPointNextAngle, nextPointProjected));
            const rayDirectionPrevious = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), resultPointPreviousAngle, previousPointProjected));

            const crossProduct = vec3.cross(vec3.create(), rayDirectionNext, rayDirectionPrevious);
            const crossProductLength = vec3.length(crossProduct);

            if (crossProductLength < 0.001) {
                vec3.transformMat4(resultPointNextAngle, resultPointNextAngle, this.#planeRestriction.transformationFromXYPlaneMatrix);
                return resultPointNextAngle;
            }

            const t = vec3.sub(vec3.create(), previousPointProjected, nextPointProjected);
            const u = vec3.cross(vec3.create(), t, rayDirectionPrevious);
            const v = vec3.cross(vec3.create(), t, rayDirectionNext);

            const tValue = vec3.dot(u, crossProduct) / crossProductLength ** 2;
            const uValue = vec3.dot(v, crossProduct) / crossProductLength ** 2;

            if (tValue < 0 || uValue < 0) {
                vec3.transformMat4(resultPointNextAngle, resultPointNextAngle, this.#planeRestriction.transformationFromXYPlaneMatrix);
                return resultPointNextAngle;
            }

            const intersection = vec3.add(vec3.create(), nextPointProjected, vec3.scale(vec3.create(), rayDirectionNext, tValue));
            [this.#polarGridHelperNext, this.#labelNext] = this.createGrid(this.#polarGridHelperNext, nextPointFromData, closestAngleNext);
            this.#activePolarGrids.next = true;
            [this.#polarGridHelperPrevious, this.#labelPrevious] = this.createGrid(this.#polarGridHelperPrevious, previousPointFromData, closestAnglePrevious);
            this.#activePolarGrids.previous = true;

            // reverse the projection to the original coordinate system
            vec3.transformMat4(intersection, intersection, this.#planeRestriction.transformationFromXYPlaneMatrix);
            return intersection;
        }

        // check which distance to the projection is smaller
        if (screenSpaceDistanceCheckNextAngle.distanceSquared < screenSpaceDistanceCheckPreviousAngle.distanceSquared) {
            [this.#polarGridHelperNext, this.#labelNext] = this.createGrid(this.#polarGridHelperNext, nextPointFromData, closestAngleNext);
            this.#activePolarGrids.next = true;

            // reverse the projection to the original coordinate system
            vec3.transformMat4(resultPointNextAngle, resultPointNextAngle, this.#planeRestriction.transformationFromXYPlaneMatrix);
            return resultPointNextAngle;
        } else {
            [this.#polarGridHelperPrevious, this.#labelPrevious] = this.createGrid(this.#polarGridHelperPrevious, previousPointFromData, closestAnglePrevious);
            this.#activePolarGrids.previous = true;

            // reverse the projection to the original coordinate system
            vec3.transformMat4(resultPointPreviousAngle, resultPointPreviousAngle, this.#planeRestriction.transformationFromXYPlaneMatrix);
            return resultPointPreviousAngle;
        }
    }

    public updatePlaneDefinition(origin: vec3, vectorU: vec3, vectorV: vec3, normal: vec3): void {
        this.#vectorU = vectorU;
        this.#vectorV = vectorV;
        this.#normal = normal;
    }

    // #endregion Public Methods (2)

    // #region Protected Methods (1)

    protected visibilityChanged(visible: boolean): void {
        if (visible === false) {
            if (this.#polarGridHelperNext) {
                this.#polarGridHelperNext.remove(...this.#polarGridHelperNext.children);
                this.#polarGridHelperNext.visible = false;
            }

            if (this.#polarGridHelperPrevious) {
                this.#polarGridHelperPrevious.remove(...this.#polarGridHelperPrevious.children);
                this.#polarGridHelperPrevious.visible = false;
            }
        }
    }

    // #endregion Protected Methods (1)

    // #region Private Methods (3)

    private calculateAngles() {
        this.#angles = [];
        for (let i = 0; i <= Math.PI + 0.0001; i += this.#angleStep) {
            this.#angles.push(i);
        }
    }

    private createGrid(polarGridHelper: THREE.PolarGridHelper | undefined, position: vec3, angle: number): [THREE.PolarGridHelper, CSS2DObject] {
        if (polarGridHelper) {
            polarGridHelper.remove(...polarGridHelper.children);
            polarGridHelper.dispose();
            this._object3D.remove(polarGridHelper);
        }

        let radius = this.#inputBoundingBox.boundingSphere.radius / 2;
        if (radius === Infinity)
            radius = 1;

        polarGridHelper = new THREE.PolarGridHelper(radius, (this.#angles.length - 1) * 2, 3, 64, 0xb352fd, 0x0d44f0);
        polarGridHelper.renderOrder = -1;
        (polarGridHelper.material as THREE.LineBasicMaterial).depthTest = false;
        (polarGridHelper.material as THREE.LineBasicMaterial).transparent = true;
        polarGridHelper.position.copy(new THREE.Vector3(position[0], position[1], position[2]));
        polarGridHelper.visible = false;

        const text = document.createElement('div');
        text.className = 'label';
        text.style.marginTop = '2.5em';
        text.textContent = `${numberCleaner((angle / Math.PI) * 180)}°`;

        const label = new CSS2DObject(text);
        label.position.set(0, 0, 0);
        label.visible = false;
        polarGridHelper.add(label);

        // rotate grid helper to match axis       
        // three.js uses a right-handed coordinate system, so we need to rotate the grid helper
        const rotationMatrix = new THREE.Matrix4().fromArray([
            this.#vectorU[0], this.#vectorU[1], this.#vectorU[2], 0,
            this.#vectorV[0], this.#vectorV[1], this.#vectorV[2], 0,
            this.#normal[0], this.#normal[1], this.#normal[2], 0,
            0, 0, 0, 1
        ]);
        polarGridHelper.rotation.setFromRotationMatrix(rotationMatrix);
        polarGridHelper.rotateX(Math.PI / 2);

        this._object3D.add(polarGridHelper);

        return [polarGridHelper, label];
    }

    private getAngularDifference(point: vec3, referencePoint: vec3): {
        angularDifference: number,
        crossProduct: vec3,
        closestAngle: number
    } {
        // calculate the angle between the previous point and the point to restrict on the axis
        const direction = vec3.sub(vec3.create(), point, referencePoint);
        const angleReference = vec3.angle(direction, vec3.fromValues(0, 1, 0));
        const crossProduct = vec3.cross(vec3.create(), vec3.fromValues(0, 1, 0), direction);

        // find the angle that is closest to the angle of the previous point
        let closestAngle = this.#angles[0];
        for (let i = 0; i < this.#angles.length; i++) {
            const angle = this.#angles[i];

            if (Math.abs(angleReference - angle) < Math.abs(angleReference - closestAngle))
                closestAngle = angle;
        }

        // move the point to the closest angle
        const angularDifference = closestAngle - angleReference;

        return {
            angularDifference,
            crossProduct,
            closestAngle
        };
    }

    // #endregion Private Methods (3)
}

// #endregion Classes (1)
