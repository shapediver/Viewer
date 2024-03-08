import THREE from 'three';
import { AbstractRestriction } from '../../AbstractRestriction';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { DrawingToolsManager } from '../../../DrawingToolsManager';
import { ISnapRestriction, SnapRestrictionProperties } from '../../../../interfaces/ISnapRestriction';
import { PlaneRestrictionProperties } from '../PlaneRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type AngularRestrictionProperties = {
    /**
     * Step size for the angles
     */
    angleStep: number;
} & SnapRestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class AngularRestriction extends AbstractRestriction implements ISnapRestriction {
    // #region Properties (6)

    private _active: boolean = false;
    private _angleStep: number;
    private _angles: number[] = [];
    private _normal: vec3;
    private _activePolarGrids = {
        first: false,
        last: false
    };
    private _polarGridHelperFirst?: THREE.PolarGridHelper;
    private _polarGridHelperLast?: THREE.PolarGridHelper;
    private _priority: number = 0;
    _labelFirst?: CSS2DObject;
    _labelLast?: CSS2DObject;

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string, properties: AngularRestrictionProperties, planeProperties: PlaneRestrictionProperties) {
        super(drawingToolsManager, id);
        this._angleStep = properties.angleStep;
        this._normal = planeProperties.normal;
        this._priority = properties.priority;
        this.calculateAngles();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get active(): boolean {
        return this._active;
    }

    public set active(value: boolean) {
        this._active = value;
        if(this._polarGridHelperFirst && this._activePolarGrids.first === value) this._polarGridHelperFirst.visible = value;
        if(this._labelFirst && this._activePolarGrids.first === value) this._labelFirst.visible = value;
        if(this._polarGridHelperLast && this._activePolarGrids.last === value) this._polarGridHelperLast.visible = value;
        if(this._labelLast && this._activePolarGrids.last === value) this._labelLast.visible = value;
    }

    public get angleStep(): number {
        return this._angleStep;
    }

    public set angleStep(value: number) {
        this._angleStep = value;
        this.calculateAngles();
    }

    public get priority(): number {
        return this._priority;
    }

    public set priority(value: number) {
        this._priority = value;
    }

    // #endregion Public Getters And Setters (4)

    // #region Public Methods (1)

    public snap(point: vec3, metaData?: { index?: number }): vec3 | undefined {
        if (this.enabled === false || metaData === undefined || metaData.index === undefined) return;

        if (this._polarGridHelperFirst) {
            this._polarGridHelperFirst.remove(...this._polarGridHelperFirst.children);
            this._polarGridHelperFirst.visible = false;
        }

        if (this._labelFirst) this._labelFirst.visible = false;

        if (this._polarGridHelperLast) {
            this._polarGridHelperLast.remove(...this._polarGridHelperLast.children);
            this._polarGridHelperLast.visible = false;
        }

        if (this._labelLast) this._labelLast.visible = false;

        this._activePolarGrids = {
            first: false,
            last: false
        };

        // move point to plane
        const projection = vec3.create();
        vec3.scale(projection, this._normal, vec3.dot(point, this._normal));
        vec3.subtract(projection, point, projection);

        const positionArray = this._drawingToolsManager.geometryManager.positionArray;

        let previousIndex, nextIndex;
        if (metaData !== undefined && metaData.index !== undefined) {
            previousIndex = metaData.index - 1 < 0 ? positionArray.length / 3 - 1 : metaData.index - 1;
            nextIndex = metaData.index + 1 > positionArray.length / 3 - 1 ? 0 : metaData.index + 1;
        } else {
            // if no index was provided, it is a new point
            previousIndex = positionArray.length / 3 - 1;
            nextIndex = 0;
        }

        if (positionArray.length < 6) return;

        // get the first point
        const firstPoint = vec3.fromValues(positionArray.at((nextIndex * 3))!, positionArray.at((nextIndex * 3) + 1)!, positionArray.at((nextIndex * 3) + 2)!);
        const { angularDifference: angularDifferenceFirst, crossProduct: crossProductFirst, closestAngle: closestAngleFirst } = this.getAngularDifference(projection, firstPoint);

        // get the last point
        const lastPoint = vec3.fromValues(positionArray.at((previousIndex * 3))!, positionArray.at((previousIndex * 3) + 1)!, positionArray.at((previousIndex * 3) + 2)!);
        const { angularDifference: angularDifferenceLast, crossProduct: crossProductLast, closestAngle: closestAngleLast } = this.getAngularDifference(projection, lastPoint);

        const resultPointFirstAngle = vec3.rotateZ(vec3.create(), projection, firstPoint, crossProductFirst[2] < 0 ? -angularDifferenceFirst : angularDifferenceFirst);
        const distanceFirstAngle = vec3.distance(resultPointFirstAngle, projection);
        const resultPointLastAngle = vec3.rotateZ(vec3.create(), projection, lastPoint, crossProductLast[2] < 0 ? -angularDifferenceLast : angularDifferenceLast);
        const distanceLastAngle = vec3.distance(resultPointLastAngle, projection);

        const distanceThreshold = 1.5;

        if (distanceFirstAngle > distanceThreshold && distanceLastAngle > distanceThreshold) return;

        // snap to clear defined point if both distances are smaller than threshold
        if (positionArray.length > 6 && distanceFirstAngle < distanceThreshold && distanceLastAngle < distanceThreshold) {
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
            [this._polarGridHelperFirst, this._labelFirst] = this.createGrid(this._polarGridHelperFirst, firstPoint, closestAngleFirst);
            this._activePolarGrids.first = true;
            [this._polarGridHelperLast, this._labelLast] = this.createGrid(this._polarGridHelperLast, lastPoint, closestAngleLast);
            this._activePolarGrids.last = true;
            return intersection;
        }

        // check which distance to the projection is smaller
        if (distanceFirstAngle < distanceLastAngle) {
            [this._polarGridHelperFirst, this._labelFirst] = this.createGrid(this._polarGridHelperFirst, firstPoint, closestAngleFirst);
            this._activePolarGrids.first = true;
            return resultPointFirstAngle;
        } else {
            [this._polarGridHelperLast, this._labelLast] = this.createGrid(this._polarGridHelperLast, lastPoint, closestAngleLast);
            this._activePolarGrids.last = true;
            return resultPointLastAngle;
        }
    }

    // #endregion Public Methods (1)

    // #region Protected Methods (1)

    protected visibilityChanged(visible: boolean): void {
        if (visible === false) {
            if (this._polarGridHelperFirst) {
                this._polarGridHelperFirst.remove(...this._polarGridHelperFirst.children);
                this._polarGridHelperFirst.visible = false;
            }

            if (this._polarGridHelperLast) {
                this._polarGridHelperLast.remove(...this._polarGridHelperLast.children);
                this._polarGridHelperLast.visible = false;
            }
        }
    }

    // #endregion Protected Methods (1)

    // #region Private Methods (3)

    private calculateAngles() {
        this._angles = [];
        for (let i = 0; i <= Math.PI + 0.0001; i += this._angleStep) {
            this._angles.push(i);
        }
    }

    private createGrid(polarGridHelper: THREE.PolarGridHelper | undefined, position: vec3, angle: number): [THREE.PolarGridHelper, CSS2DObject] {
        if (polarGridHelper) {
            polarGridHelper.remove(...polarGridHelper.children);
            polarGridHelper.dispose();
            this._object3D.remove(polarGridHelper);
        }

        polarGridHelper = new THREE.PolarGridHelper(5, (this._angles.length - 1) * 2, 3, 64, 0xb352fd, 0x0d44f0);
        polarGridHelper.renderOrder = -1;
        (polarGridHelper.material as THREE.LineBasicMaterial).depthTest = false;
        (polarGridHelper.material as THREE.LineBasicMaterial).transparent = true;
        polarGridHelper.position.copy(new THREE.Vector3(position[0], position[1], position[2]));
        polarGridHelper.visible = false;

        const text = document.createElement('div');
        text.className = 'label';
        text.style.marginTop = '2.5em';
        text.textContent = `${this._drawingToolsManager.textVisualizationManager.numberCleaner((angle / Math.PI) * 180)}°`;

        const label = new CSS2DObject(text);
        label.position.set(0, 0, 0);
        label.visible = false;
        polarGridHelper.add(label);

        // rotate grid helper to match axis
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(this._normal[0], this._normal[1], this._normal[2]));
        polarGridHelper.quaternion.copy(quaternion);

        this._object3D.add(polarGridHelper);

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
        let closestAngle = this._angles[0];
        for (let i = 0; i < this._angles.length; i++) {
            const angle = this._angles[i];

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
