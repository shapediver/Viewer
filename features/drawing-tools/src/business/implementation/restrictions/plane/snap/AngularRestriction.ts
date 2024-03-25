import THREE from 'three';
import { AbstractRestriction } from '../../AbstractRestriction';
import { DrawingToolsManager } from '../../../DrawingToolsManager';
import { ISnapRestriction, SnapRestrictionProperties } from '../../../../interfaces/ISnapRestriction';
import { PlaneRestrictionProperties } from '../PlaneRestriction';
import { vec3 } from 'gl-matrix';
import { CSS2DObject } from '../../../../../three/CSS2DRenderer';

// #region Type aliases (1)

export type AngularRestrictionProperties = {
    /**
     * Step size for the angles
     */
    angleStep?: number;
} & SnapRestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class AngularRestriction extends AbstractRestriction implements ISnapRestriction {
    // #region Properties (10)

    #active: boolean = false;
    #activePolarGrids = {
        first: false,
        last: false
    };
    #angleStep: number;
    #angles: number[] = [];
    #labelFirst?: CSS2DObject;
    #labelLast?: CSS2DObject;
    #normal: vec3;
    #polarGridHelperFirst?: THREE.PolarGridHelper;
    #polarGridHelperLast?: THREE.PolarGridHelper;
    #priority: number = 0;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string, planeProperties: PlaneRestrictionProperties, properties?: AngularRestrictionProperties) {
        super(drawingToolsManager, id);
        this.available = properties?.available ?? true;
        this.#angleStep = properties?.angleStep || Math.PI / 8;
        this.#normal = planeProperties.normal!;
        this.#priority = properties?.priority || 0;
        this.calculateAngles();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (6)

    public get active(): boolean {
        return this.#active;
    }

    public set active(value: boolean) {
        this.#active = value;
        if (this.#polarGridHelperFirst && this.#activePolarGrids.first === value) this.#polarGridHelperFirst.visible = value;
        if (this.#labelFirst && this.#activePolarGrids.first === value) this.#labelFirst.visible = value;
        if (this.#polarGridHelperLast && this.#activePolarGrids.last === value) this.#polarGridHelperLast.visible = value;
        if (this.#labelLast && this.#activePolarGrids.last === value) this.#labelLast.visible = value;
    }

    public get angleStep(): number {
        return this.#angleStep;
    }

    public set angleStep(value: number) {
        this.#angleStep = value;
        this.calculateAngles();
    }

    public get priority(): number {
        return this.#priority;
    }

    public set priority(value: number) {
        this.#priority = value;
    }

    // #endregion Public Getters And Setters (6)

    // #region Public Methods (1)

    public snap(point: vec3, metaData?: { index?: number }): vec3 | undefined {
        if (this.canBeActive() === false || metaData === undefined || metaData.index === undefined) return;

        if (this.#polarGridHelperFirst) {
            this.#polarGridHelperFirst.remove(...this.#polarGridHelperFirst.children);
            this.#polarGridHelperFirst.visible = false;
        }

        if (this.#labelFirst) this.#labelFirst.visible = false;

        if (this.#polarGridHelperLast) {
            this.#polarGridHelperLast.remove(...this.#polarGridHelperLast.children);
            this.#polarGridHelperLast.visible = false;
        }

        if (this.#labelLast) this.#labelLast.visible = false;

        this.#activePolarGrids = {
            first: false,
            last: false
        };

        const positionArray = this.drawingToolsManager.geometryManager.positionArray;

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

        // get the first point
        const firstPoint = vec3.fromValues(positionArray.at((nextIndex * 3))!, positionArray.at((nextIndex * 3) + 1)!, positionArray.at((nextIndex * 3) + 2)!);

        // get the last point
        const lastPoint = vec3.fromValues(positionArray.at((previousIndex * 3))!, positionArray.at((previousIndex * 3) + 1)!, positionArray.at((previousIndex * 3) + 2)!);

        // check if they are on the plane that is defined by the point and the normal
        const firstPointOnPlane = vec3.dot(firstPoint, this.#normal) === 0;
        const lastPointOnPlane = vec3.dot(lastPoint, this.#normal) === 0;

        if (!firstPointOnPlane || !lastPointOnPlane) return;

        const { angularDifference: angularDifferenceFirst, crossProduct: crossProductFirst, closestAngle: closestAngleFirst } = this.getAngularDifference(point, firstPoint);
        const { angularDifference: angularDifferenceLast, crossProduct: crossProductLast, closestAngle: closestAngleLast } = this.getAngularDifference(point, lastPoint);

        const resultPointFirstAngle = vec3.rotateZ(vec3.create(), point, firstPoint, crossProductFirst[2] < 0 ? -angularDifferenceFirst : angularDifferenceFirst);
        const screenSpaceDistanceCheckFirstAngle = this.drawingToolsManager.geometryMathManager.screenSpaceDistanceCheck(resultPointFirstAngle, point, this.drawingToolsManager.settings.visualization.points.size_0! * this.drawingToolsManager.settings.visualization.distanceMultiplicationFactor);
        const resultPointLastAngle = vec3.rotateZ(vec3.create(), point, lastPoint, crossProductLast[2] < 0 ? -angularDifferenceLast : angularDifferenceLast);
        const screenSpaceDistanceCheckLastAngle = this.drawingToolsManager.geometryMathManager.screenSpaceDistanceCheck(resultPointLastAngle, point, this.drawingToolsManager.settings.visualization.points.size_0! * this.drawingToolsManager.settings.visualization.distanceMultiplicationFactor);

        if (screenSpaceDistanceCheckFirstAngle.check === false && screenSpaceDistanceCheckLastAngle.check === false) return;

        // snap to clear defined point if both distances are smaller than threshold
        if (positionArray.length > 6 && screenSpaceDistanceCheckFirstAngle.check === true && screenSpaceDistanceCheckLastAngle.check === true) {
            const rayDirectionFirst = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), resultPointFirstAngle, firstPoint));
            const rayDirectionLast = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), resultPointLastAngle, lastPoint));

            const crossProduct = vec3.cross(vec3.create(), rayDirectionFirst, rayDirectionLast);
            const crossProductLength = vec3.length(crossProduct);

            if (crossProductLength < 0.001) {
                return resultPointFirstAngle;
            }

            const t = vec3.sub(vec3.create(), lastPoint, firstPoint);
            const u = vec3.cross(vec3.create(), t, rayDirectionLast);
            const v = vec3.cross(vec3.create(), t, rayDirectionFirst);

            const tValue = vec3.dot(u, crossProduct) / crossProductLength ** 2;
            const uValue = vec3.dot(v, crossProduct) / crossProductLength ** 2;

            if (tValue < 0 || uValue < 0) {
                return resultPointFirstAngle;
            }

            const intersection = vec3.add(vec3.create(), firstPoint, vec3.scale(vec3.create(), rayDirectionFirst, tValue));
            [this.#polarGridHelperFirst, this.#labelFirst] = this.createGrid(this.#polarGridHelperFirst, firstPoint, closestAngleFirst);
            this.#activePolarGrids.first = true;
            [this.#polarGridHelperLast, this.#labelLast] = this.createGrid(this.#polarGridHelperLast, lastPoint, closestAngleLast);
            this.#activePolarGrids.last = true;
            return intersection;
        }

        // check which distance to the projection is smaller
        if (screenSpaceDistanceCheckFirstAngle.distanceSquared < screenSpaceDistanceCheckLastAngle.distanceSquared) {
            [this.#polarGridHelperFirst, this.#labelFirst] = this.createGrid(this.#polarGridHelperFirst, firstPoint, closestAngleFirst);
            this.#activePolarGrids.first = true;
            return resultPointFirstAngle;
        } else {
            [this.#polarGridHelperLast, this.#labelLast] = this.createGrid(this.#polarGridHelperLast, lastPoint, closestAngleLast);
            this.#activePolarGrids.last = true;
            return resultPointLastAngle;
        }
    }

    // #endregion Public Methods (1)

    // #region Protected Methods (1)

    protected visibilityChanged(visible: boolean): void {
        if (visible === false) {
            if (this.#polarGridHelperFirst) {
                this.#polarGridHelperFirst.remove(...this.#polarGridHelperFirst.children);
                this.#polarGridHelperFirst.visible = false;
            }

            if (this.#polarGridHelperLast) {
                this.#polarGridHelperLast.remove(...this.#polarGridHelperLast.children);
                this.#polarGridHelperLast.visible = false;
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
            this.object3D.remove(polarGridHelper);
        }

        polarGridHelper = new THREE.PolarGridHelper(5, (this.#angles.length - 1) * 2, 3, 64, 0xb352fd, 0x0d44f0);
        polarGridHelper.renderOrder = -1;
        (polarGridHelper.material as THREE.LineBasicMaterial).depthTest = false;
        (polarGridHelper.material as THREE.LineBasicMaterial).transparent = true;
        polarGridHelper.position.copy(new THREE.Vector3(position[0], position[1], position[2]));
        polarGridHelper.visible = false;

        const text = document.createElement('div');
        text.className = 'label';
        text.style.marginTop = '2.5em';
        text.textContent = `${this.drawingToolsManager.textVisualizationManager.numberCleaner((angle / Math.PI) * 180)}°`;

        const label = new CSS2DObject(text);
        label.position.set(0, 0, 0);
        label.visible = false;
        polarGridHelper.add(label);

        // rotate grid helper to match axis
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(this.#normal[0], this.#normal[1], this.#normal[2]));
        polarGridHelper.quaternion.copy(quaternion);

        this.object3D.add(polarGridHelper);

        return [polarGridHelper, label];
    }

    private getAngularDifference(point: vec3, referencePoint: vec3): {
        angularDifference: number,
        crossProduct: vec3,
        closestAngle: number
    } {
        // calculate the angle between the last point and the point to restrict on the axis
        const direction = vec3.sub(vec3.create(), point, referencePoint);
        const angleReference = vec3.angle(direction, vec3.fromValues(0, 1, 0));
        const crossProduct = vec3.cross(vec3.create(), vec3.fromValues(0, 1, 0), direction);

        // find the angle that is closest to the angle of the last point
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
