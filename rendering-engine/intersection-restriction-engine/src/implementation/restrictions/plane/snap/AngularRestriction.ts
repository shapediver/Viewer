import { AbstractSnapRestriction } from '../../AbstractSnapRestriction';
import { CSS2DObject } from '@shapediver/viewer.rendering-engine.rendering-engine-threejs';
import { GeometryMathManager } from '../../../GeometryMathManager';
import { IRay } from '@shapediver/viewer.shared.types';
import { isDrawingRestriction, RestrictionMetaData, RestrictionResult } from '../../../../interfaces/IRestriction';
import { ISnapRestriction, SnapRestrictionProperties } from '../../../../interfaces/ISnapRestriction';
import { ITreeNode, IViewportApi, sceneTree } from '@shapediver/viewer';
import { IVisualizationSettings } from '../../../../interfaces/IVisualizationSettings';
import { numberCleaner } from '@shapediver/viewer.shared.services';
import { PlaneRestriction } from '../PlaneRestriction';
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

export class AngularRestriction extends AbstractSnapRestriction implements ISnapRestriction {
    // #region Properties (12)

    readonly #activationKey: string;
    readonly #geometryMathManager: GeometryMathManager;
    readonly #planeRestriction: PlaneRestriction;

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
    #priority: number = 0;
    #settings: IVisualizationSettings;

    // #endregion Properties (12)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, geometryMathManager: GeometryMathManager, parentNode: ITreeNode, planeRestriction: PlaneRestriction, settings: IVisualizationSettings, properties?: AngularRestrictionProperties) {
        super(viewport, parentNode, 'angular');

        this.#geometryMathManager = geometryMathManager;
        this.#settings = settings;

        this.#planeRestriction = planeRestriction;

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

        if (value === false) {
            if (this.#labelNext) this.#labelNext.visible = false;
            if (this.#labelPrevious) this.#labelPrevious.visible = false;
        } else {
            if (this.#labelNext && this.#activePolarGrids.next) this.#labelNext.visible = true;
            if (this.#labelPrevious && this.#activePolarGrids.previous) this.#labelPrevious.visible = true;
        }
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

    public snap(ray: IRay, point: vec3, distance: number, metaData?: RestrictionMetaData): RestrictionResult | undefined {
        if (!isDrawingRestriction(metaData)) return;

        // if the restriction is not enabled OR the activation key is set and the key is not pressed, return
        if (this.enabled === false && !(metaData?.toggledKeys?.length === 1 && metaData?.toggledKeys[0] === this.#activationKey)) return;

        if (this.#labelNext) this.#labelNext.visible = false;
        if (this.#labelPrevious) this.#labelPrevious.visible = false;

        this.#activePolarGrids = {
            next: false,
            previous: false
        };

        const positionArray = metaData?.positionArray;
        if (!positionArray) return;

        let previousIndex, nextIndex;
        if (metaData !== undefined && metaData.index !== undefined) {
            previousIndex = this.getPreviousIndex(metaData.index, positionArray);
            nextIndex = this.getNextIndex(metaData.index, positionArray);
        } else {
            // if no index was provided, it is a new point
            previousIndex = positionArray.length / 3 - 1;
            nextIndex = 0;
        }

        const previousPreviousIndex = this.getPreviousIndex(previousIndex, positionArray);
        const nextNextIndex = this.getNextIndex(nextIndex, positionArray);

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
        const nextNextPointFromData = vec3.fromValues(positionArray.at((nextNextIndex * 3))!, positionArray.at((nextNextIndex * 3) + 1)!, positionArray.at((nextNextIndex * 3) + 2)!);
        const previousPointFromData = vec3.fromValues(positionArray.at((previousIndex * 3))!, positionArray.at((previousIndex * 3) + 1)!, positionArray.at((previousIndex * 3) + 2)!);
        const previousPreviousPointFromData = vec3.fromValues(positionArray.at((previousPreviousIndex * 3))!, positionArray.at((previousPreviousIndex * 3) + 1)!, positionArray.at((previousPreviousIndex * 3) + 2)!);

        // project them onto the same plane as the point
        const nextPointProjected = vec3.sub(vec3.create(), nextPointFromData, vec3.scale(vec3.create(), this.#planeRestriction.normal, vec3.dot(vec3.sub(vec3.create(), nextPointFromData, point), this.#planeRestriction.normal)));
        const nextNextPointProjected = vec3.sub(vec3.create(), nextNextPointFromData, vec3.scale(vec3.create(), this.#planeRestriction.normal, vec3.dot(vec3.sub(vec3.create(), nextNextPointFromData, point), this.#planeRestriction.normal)));
        const previousPointProjected = vec3.sub(vec3.create(), previousPointFromData, vec3.scale(vec3.create(), this.#planeRestriction.normal, vec3.dot(vec3.sub(vec3.create(), previousPointFromData, point), this.#planeRestriction.normal)));
        const previousPreviousPointProjected = vec3.sub(vec3.create(), previousPreviousPointFromData, vec3.scale(vec3.create(), this.#planeRestriction.normal, vec3.dot(vec3.sub(vec3.create(), previousPreviousPointFromData, point), this.#planeRestriction.normal)));

        // project the point onto the XY-Plane
        const pointProjected = vec3.transformMat4(vec3.create(), point, this.#planeRestriction.transformationToXYPlaneMatrix);
        vec3.transformMat4(nextPointProjected, nextPointProjected, this.#planeRestriction.transformationToXYPlaneMatrix);
        vec3.transformMat4(nextNextPointProjected, nextNextPointProjected, this.#planeRestriction.transformationToXYPlaneMatrix);
        vec3.transformMat4(previousPointProjected, previousPointProjected, this.#planeRestriction.transformationToXYPlaneMatrix);
        vec3.transformMat4(previousPreviousPointProjected, previousPreviousPointProjected, this.#planeRestriction.transformationToXYPlaneMatrix);

        // calculate the angle between the next and previous point and the point to restrict on the axis
        const { angularDifference: angularDifferenceNext, crossProduct: crossProductNext, closestAngle: closestAngleNext } = this.getAngularDifference({ start: nextPointProjected, end: nextNextPointProjected }, { start: nextPointProjected, end: pointProjected });
        const { angularDifference: angularDifferencePrevious, crossProduct: crossProductPrevious, closestAngle: closestAnglePrevious } = this.getAngularDifference({ start: previousPointProjected, end: previousPreviousPointProjected }, { start: previousPointProjected, end: pointProjected });

        // calculate the distances in screen space so we can check how close it is
        const resultPointNextAngle = vec3.rotateZ(vec3.create(), pointProjected, nextPointProjected, crossProductNext[2] < 0 ? -angularDifferenceNext : angularDifferenceNext);
        const screenSpaceDistanceCheckNextAngle = this.#geometryMathManager.screenSpaceDistanceCheck(resultPointNextAngle, pointProjected, this.#settings.points.size_0! * this.#settings.distanceMultiplicationFactor);
        const resultPointPreviousAngle = vec3.rotateZ(vec3.create(), pointProjected, previousPointProjected, crossProductPrevious[2] < 0 ? -angularDifferencePrevious : angularDifferencePrevious);
        const screenSpaceDistanceCheckPreviousAngle = this.#geometryMathManager.screenSpaceDistanceCheck(resultPointPreviousAngle, pointProjected, this.#settings.points.size_0! * this.#settings.distanceMultiplicationFactor);

        if (screenSpaceDistanceCheckNextAngle.check === false && screenSpaceDistanceCheckPreviousAngle.check === false) return;

        // snap to clear defined point if both distances are smaller than threshold
        if (positionArray.length > 6 && screenSpaceDistanceCheckNextAngle.check === true && screenSpaceDistanceCheckPreviousAngle.check === true) {
            const rayDirectionNext = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), resultPointNextAngle, nextPointProjected));
            const rayDirectionPrevious = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), resultPointPreviousAngle, previousPointProjected));

            const crossProduct = vec3.cross(vec3.create(), rayDirectionNext, rayDirectionPrevious);
            const crossProductLength = vec3.length(crossProduct);

            if (crossProductLength < 0.001) {
                vec3.transformMat4(resultPointNextAngle, resultPointNextAngle, this.#planeRestriction.transformationFromXYPlaneMatrix);
                return { targetPoint: resultPointNextAngle, distanceClosestPointToTargetPointSquared: vec3.sqrDist(resultPointNextAngle, point), closestIntersectionPoint: point, distanceOriginToClosestIntersectionPointSquared: distance, restriction: this.#planeRestriction, snapRestriction: this };
            }

            const t = vec3.sub(vec3.create(), previousPointProjected, nextPointProjected);
            const u = vec3.cross(vec3.create(), t, rayDirectionPrevious);
            const v = vec3.cross(vec3.create(), t, rayDirectionNext);

            const tValue = vec3.dot(u, crossProduct) / crossProductLength ** 2;
            const uValue = vec3.dot(v, crossProduct) / crossProductLength ** 2;

            if (tValue < 0 || uValue < 0) {
                vec3.transformMat4(resultPointNextAngle, resultPointNextAngle, this.#planeRestriction.transformationFromXYPlaneMatrix);
                return { targetPoint: resultPointNextAngle, distanceClosestPointToTargetPointSquared: vec3.sqrDist(resultPointNextAngle, point), closestIntersectionPoint: point, distanceOriginToClosestIntersectionPointSquared: distance, restriction: this.#planeRestriction, snapRestriction: this };
            }

            const intersection = vec3.add(vec3.create(), nextPointProjected, vec3.scale(vec3.create(), rayDirectionNext, tValue));
            this.#labelNext = this.createGrid(this.#labelNext, nextPointFromData, closestAngleNext);
            this.#activePolarGrids.next = true;
            this.#labelPrevious = this.createGrid(this.#labelPrevious, previousPointFromData, closestAnglePrevious);
            this.#activePolarGrids.previous = true;

            // reverse the projection to the original coordinate system
            vec3.transformMat4(intersection, intersection, this.#planeRestriction.transformationFromXYPlaneMatrix);
            return { targetPoint: intersection, distanceClosestPointToTargetPointSquared: vec3.sqrDist(intersection, point), closestIntersectionPoint: point, distanceOriginToClosestIntersectionPointSquared: distance, restriction: this.#planeRestriction, snapRestriction: this };
        }

        // check which distance to the projection is smaller
        if (screenSpaceDistanceCheckNextAngle.distanceSquared < screenSpaceDistanceCheckPreviousAngle.distanceSquared) {
            this.#labelNext = this.createGrid(this.#labelNext, nextPointFromData, closestAngleNext);
            this.#activePolarGrids.next = true;

            // reverse the projection to the original coordinate system
            vec3.transformMat4(resultPointNextAngle, resultPointNextAngle, this.#planeRestriction.transformationFromXYPlaneMatrix);
            return { targetPoint: resultPointNextAngle, distanceClosestPointToTargetPointSquared: vec3.sqrDist(resultPointNextAngle, point), closestIntersectionPoint: point, distanceOriginToClosestIntersectionPointSquared: distance, restriction: this.#planeRestriction, snapRestriction: this };
        } else {
            this.#labelPrevious = this.createGrid(this.#labelPrevious, previousPointFromData, closestAnglePrevious);
            this.#activePolarGrids.previous = true;

            // reverse the projection to the original coordinate system
            vec3.transformMat4(resultPointPreviousAngle, resultPointPreviousAngle, this.#planeRestriction.transformationFromXYPlaneMatrix);
            return { targetPoint: resultPointPreviousAngle, distanceClosestPointToTargetPointSquared: vec3.sqrDist(resultPointPreviousAngle, point), closestIntersectionPoint: point, distanceOriginToClosestIntersectionPointSquared: distance, restriction: this.#planeRestriction, snapRestriction: this };
        }
    }

    public updatePlaneDefinition(): void { }

    // #endregion Public Methods (2)

    // #region Protected Methods (1)

    protected visibilityChanged(visible: boolean): void {
        if (visible === false) {
            if (this.#labelNext) this.#labelNext.visible = false;
            if (this.#labelPrevious) this.#labelPrevious.visible = false;
        }
    }

    // #endregion Protected Methods (1)

    // #region Private Methods (5)

    private calculateAngles() {
        this.#angles = [];
        for (let i = 0; i <= Math.PI + 0.0001; i += this.#angleStep) {
            this.#angles.push(i);
        }
    }

    private createGrid(label: CSS2DObject | undefined, position: vec3, angle: number): CSS2DObject {
        if (label)
            this._object3D.remove(label);

        let radius = sceneTree.root.boundingBox.boundingSphere.radius / 100;
        if (radius === Infinity)
            radius = 1;

        const text = document.createElement('div');
        text.className = 'label';
        label = new CSS2DObject(text);

        // remove the old style, if there is one 
        document.head.querySelectorAll('style').forEach(style => {
            if (style.textContent?.includes(label!.uuid))
                document.head.removeChild(style);
        });

        const parent = document.createElement('div');
        parent.className = `angular-label-parent-${label!.uuid}`;
        const child = document.createElement('div');
        child.className = `angular-label-${label!.uuid}`;

        const style = document.createElement('style');
        style.textContent = `
            .angular-label-${label!.uuid} {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 32px;
                height: 32px;
                color: white;
                background-color: ${this.#settings.points.color_1};
                border-radius: 50%;
                font-size: 16px;
                text-align: center;
            }

            .angular-label-parent-${label!.uuid} {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 40px; /* 32px + 2 * 4px border width */
                height: 40px; /* 32px + 2 * 4px border width */
                border-radius: 50%;
                background: conic-gradient(
                    ${this.#settings.points.color_2} 0% ${(angle / Math.PI) * 100}%,
                    ${this.#settings.points.color_1} ${(angle / Math.PI) * 100}% 100%
                );
            }
        `;
        document.head.appendChild(style);

        parent.appendChild(child);

        child.textContent = `${numberCleaner((angle / Math.PI) * 180)}°`;
        text.appendChild(parent);

        label.position.set(position[0], position[1], position[2]);
        label.visible = false;
        this._object3D.add(label);

        return label;
    }

    private getAngularDifference(
        line: {
            start: vec3, end: vec3
        },
        referenceLine: {
            start: vec3, end: vec3
        }
    ): {
        angularDifference: number,
        crossProduct: vec3,
        closestAngle: number
    } {
        const lineDirection = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), line.end, line.start));
        const referenceLineDirection = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), referenceLine.end, referenceLine.start));

        // calculate the angle between the lineDirection and the referenceLineDirection
        const angleReference = vec3.angle(lineDirection, referenceLineDirection);
        const crossProduct = vec3.cross(vec3.create(), lineDirection, referenceLineDirection);

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

    private getNextIndex(index: number, positionArray: Float32Array): number {
        return index + 1 > positionArray.length / 3 - 1 ? 0 : index + 1;
    }

    private getPreviousIndex(index: number, positionArray: Float32Array): number {
        return index - 1 < 0 ? positionArray.length / 3 - 1 : index - 1;
    }

    // #endregion Private Methods (5)
}

// #endregion Classes (1)
