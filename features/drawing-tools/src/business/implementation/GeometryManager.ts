import {
    AttributeData,
    GeometryData,
    IGeometryData,
    MapData,
    MATERIAL_ALPHA,
    MaterialBasicLineData,
    MaterialMultiPointData,
    PRIMITIVE_MODE,
    PrimitiveData
} from '@shapediver/viewer.shared.types';
import { DrawingToolsManager } from './DrawingToolsManager';
import { IManager } from '../interfaces/IManager';
import { IRay } from '@shapediver/viewer.features.interaction';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { MultiPointsMaterial } from '@shapediver/viewer.rendering-engine-threejs.standard';
import { sceneTree } from '@shapediver/viewer';
import { vec3 } from 'gl-matrix';

export class GeometryManager implements IManager {
    // #region Properties (11)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #parentNode: ITreeNode;

    #alreadyInserted: boolean = false;
    #geometryDataLines?: IGeometryData;
    #geometryDataPoints: IGeometryData;
    #indicesArrayLines?: Uint8Array | null;
    #insertionActive: boolean = false;
    #lastEvent?: MouseEvent | TouchEvent;
    #materialIndexArray: number[] = [];
    #positionArray: Float32Array;
    #positionIndexArray: Float32Array;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawingToolsManager;

        if (this.#drawingToolsManager.customizationProperties.geometry.parentNode !== undefined) {
            // search for the node that contains the geometry data
            const parentNode = sceneTree.root.getNodesByName(this.#drawingToolsManager.customizationProperties.geometry.parentNode)[0];

            if (!parentNode)
                throw new Error('The node with the name ' + this.#drawingToolsManager.customizationProperties.geometry.parentNode + ' does not exist. Please check the name of the node in the scene tree.');

            // get the geometry data from the node
            let data;
            parentNode.traverseData(d => {
                if (d instanceof GeometryData)
                    data = d;
            });

            if (!data)
                throw new Error('The node with the name ' + this.#drawingToolsManager.customizationProperties.geometry.parentNode + ' does not contain any geometry data. Please check the node in the scene tree.');

            const geometryData = data as IGeometryData;

            if (!geometryData.primitive.attributes['POSITION'])
                throw new Error('The geometry data does not contain a position attribute. Please check the geometry data in the scene tree.');

            this.#parentNode = parentNode;

            if (geometryData.mode === PRIMITIVE_MODE.POINTS) {
                this.#geometryDataPoints = geometryData;
            } else {
                this.#geometryDataLines = geometryData;
                this.#indicesArrayLines = geometryData.primitive.indices ? geometryData.primitive.indices.array as Uint8Array : null;

                this.#geometryDataPoints = new GeometryData(
                    new PrimitiveData(
                        {
                            'POSITION': geometryData.primitive.attributes['POSITION']
                        }
                    ),
                    PRIMITIVE_MODE.POINTS
                );
                parentNode.addData(this.#geometryDataPoints);
            }
            this.#positionArray = geometryData.primitive.attributes['POSITION'].array as Float32Array;

        } else {
            // create a new node with the geometry data
            const parentNode = new TreeNode('Drawing Tools');
            sceneTree.root.addChild(parentNode);

            this.#parentNode = parentNode;

            this.#positionArray = new Float32Array();

            this.#geometryDataPoints = new GeometryData(
                new PrimitiveData({
                    'POSITION': new AttributeData(this.#positionArray, 3, 12, 0, 4, false, 0)
                }),
                PRIMITIVE_MODE.POINTS
            );
            parentNode.addData(this.#geometryDataPoints);

            if (this.#drawingToolsManager.customizationProperties.geometry.mode !== PRIMITIVE_MODE.POINTS) {
                this.#indicesArrayLines = new Uint8Array();
                this.#geometryDataLines = new GeometryData(
                    new PrimitiveData({
                        'POSITION': new AttributeData(this.#positionArray, 3, 12, 0, 4, false, 0)
                    },
                        new AttributeData(this.#indicesArrayLines, 1, 2, 0, 2, false, 0)),
                    PRIMITIVE_MODE.LINES
                );
                parentNode.addData(this.#geometryDataLines);
            }
        }

        this.#positionIndexArray = this.createAndSetPositionIndexArray();

        // create material index array
        this.#materialIndexArray = new Array(1024).fill(0);

        this.#geometryDataPoints.material = new MaterialMultiPointData(
            Object.assign(
                {
                    materialIndexDataMap: new MapData(new Image(), { asData: true, data: this.#materialIndexArray }),
                    materialIndexDataMapSize: 1024,
                    alphaMode: MATERIAL_ALPHA.BLEND,
                    depthTest: false,
                    depthWrite: false,
                    transparent: true
                },
                this.#drawingToolsManager.customizationProperties.visualizationOptions.points
            )
        );

        this.#geometryDataPoints.primitive.updateVersion();
        this.#geometryDataPoints.updateVersion();

        if (this.#geometryDataLines) {
            this.#geometryDataLines.material = new MaterialBasicLineData(
                Object.assign(
                    {
                        alphaMode: MATERIAL_ALPHA.BLEND,
                        depthTest: false,
                        depthWrite: false,
                        transparent: true
                    },
                    this.#drawingToolsManager.customizationProperties.visualizationOptions.lines
                )
            );
            this.#geometryDataLines.primitive.updateVersion();
            this.#geometryDataLines.updateVersion();
        }

        this.#parentNode.updateVersion();
        this.#drawingToolsManager.viewport.update();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get geometryData(): IGeometryData {
        return this.#geometryDataPoints;
    }

    public get materialIndexArray(): number[] {
        return this.#materialIndexArray;
    }

    public get positionArray(): Float32Array {
        return this.#positionArray;
    }

    public get positionIndexArray(): Float32Array {
        return this.#positionIndexArray;
    }

    // #endregion Public Getters And Setters (4)

    // #region Public Methods (9)

    public addPoint(insertionIndex: number, position?: vec3 | undefined, lineIndices?: number[]): void {
        const positionArrayLength = this.#positionArray.length / 3;
        const scaledIndex = insertionIndex * 3;
        if (insertionIndex < 0 || insertionIndex > positionArrayLength) {
            throw new Error('TODO');
        }

        const newPositionArray = new Float32Array(this.#positionArray.length + 3);

        let p: vec3;
        if (position) {
            p = position;
        } else if (insertionIndex === 0) {
            p = [this.#positionArray.at(scaledIndex + 0)!, this.#positionArray.at(scaledIndex + 1)!, this.#positionArray.at(scaledIndex + 2)!];
        } else if (insertionIndex === positionArrayLength) {
            p = [this.#positionArray.at(scaledIndex - 3)!, this.#positionArray.at(scaledIndex - 2)!, this.#positionArray.at(scaledIndex - 1)!];
        } else {
            const p1 = vec3.fromValues(this.#positionArray.at(scaledIndex + 0)!, this.#positionArray.at(scaledIndex + 1)!, this.#positionArray.at(scaledIndex + 2)!);
            const p2 = vec3.fromValues(this.#positionArray.at(scaledIndex + 3)!, this.#positionArray.at(scaledIndex + 4)!, this.#positionArray.at(scaledIndex + 5)!);
            p = vec3.div(vec3.create(), vec3.add(vec3.create(), p2, p1), vec3.fromValues(2, 2, 2));
            // get neighboring point and calculate center
        }

        newPositionArray.set([...this.#positionArray.slice(0, scaledIndex), ...p, ...this.#positionArray.slice(scaledIndex, this.#positionArray.length)]);
        this.#positionArray = newPositionArray;

        if (this.#indicesArrayLines && this.#geometryDataLines)
            this.createLineIndices(true);

        this.#geometryDataPoints.primitive.attributes['POSITION'] = new AttributeData(this.#positionArray, this.#geometryDataPoints.primitive.attributes['POSITION'].itemSize, this.#geometryDataPoints.primitive.attributes['POSITION'].itemBytes, this.#geometryDataPoints.primitive.attributes['POSITION'].byteOffset, this.#geometryDataPoints.primitive.attributes['POSITION'].elementBytes, this.#geometryDataPoints.primitive.attributes['POSITION'].normalized, this.#geometryDataPoints.primitive.attributes['POSITION'].count + 1);
        if (this.#geometryDataLines) this.#geometryDataLines.primitive.attributes['POSITION'] = new AttributeData(this.#positionArray, this.#geometryDataLines.primitive.attributes['POSITION'].itemSize, this.#geometryDataLines.primitive.attributes['POSITION'].itemBytes, this.#geometryDataLines.primitive.attributes['POSITION'].byteOffset, this.#geometryDataLines.primitive.attributes['POSITION'].elementBytes, this.#geometryDataLines.primitive.attributes['POSITION'].normalized, this.#geometryDataLines.primitive.attributes['POSITION'].count + 1);

        this.createAndSetPositionIndexArray();

        // set the material index at that point to 0 and move the other indices back

        this.#geometryDataPoints.updateVersion();
        this.#geometryDataPoints.primitive.updateVersion();
        if (this.#geometryDataLines) {
            this.#geometryDataLines.updateVersion();
            this.#geometryDataLines.primitive.updateVersion();
        }
        this.#parentNode.updateVersion();
    }

    public close(): void {
        this.#parentNode.removeData(this.#geometryDataPoints);
        if (this.#drawingToolsManager.customizationProperties.geometry.mode !== PRIMITIVE_MODE.POINTS && this.#geometryDataLines)
            this.#parentNode.removeData(this.#geometryDataLines);
    }

    public movePoint(index: number, point: vec3, onlyThreeJs: boolean): void {
        const threeJsPointsGeometry: THREE.Points = this.#geometryDataPoints.threeJsObject[this.#drawingToolsManager.viewport.id] as THREE.Points;
        threeJsPointsGeometry.geometry.attributes['position'].setXYZ(index, point[0], point[1], point[2]);
        threeJsPointsGeometry.geometry.attributes['position'].needsUpdate = true;

        if (this.#geometryDataLines) {
            const threeJsLinesGeometry: THREE.LineSegments = this.#geometryDataLines.threeJsObject[this.#drawingToolsManager.viewport.id] as THREE.LineSegments;
            threeJsLinesGeometry.geometry.attributes['position'].setXYZ(index, point[0], point[1], point[2]);
            threeJsLinesGeometry.geometry.attributes['position'].needsUpdate = true;
        }

        if (onlyThreeJs === false) {
            // adjust position array
            this.#positionArray.set([...this.#positionArray.slice(0, index * 3), ...point, ...this.#positionArray.slice(index * 3 + 3, this.#positionArray.length)]);
        }
    }

    public onDown(event: MouseEvent | TouchEvent, ray: IRay): boolean {
        if (this.#drawingToolsManager.keyPressed(event as MouseEvent, this.#drawingToolsManager.customizationProperties.controls.delete)) {
            // check if there is a point close to the ray
            const distances = this.#drawingToolsManager.geometryMathManager.checkDistances(ray, this.#positionArray);
            if (distances) {
                // add the id if it is not already in the array
                // remove it if it is in the array
                this.removePoint(distances[0].index);
            }
            return true;

        } else if (this.#drawingToolsManager.keyPressed(event as MouseEvent, this.#drawingToolsManager.customizationProperties.controls.insert)) {
            this.#insertionActive = false;
        }
        return false;
    }

    public onKeyDown(event: KeyboardEvent): void {
        if (this.#drawingToolsManager.keyPressed(event, this.#drawingToolsManager.customizationProperties.controls.insert)) {
            this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = true;
        }

        if (this.#drawingToolsManager.keyPressed(event, this.#drawingToolsManager.customizationProperties.controls.insert) && this.#insertionActive === false) {
            if (!this.#lastEvent) {
                this.#alreadyInserted = false;
                return;
            }
            // get current ray
            const ray = this.#lastEvent instanceof MouseEvent ? this.#drawingToolsManager.viewport.mouseEventToRay(this.#lastEvent) : this.#drawingToolsManager.viewport.touchEventToRay(this.#lastEvent);

            // add a point at the ray intersection
            const restrictedPoint = this.#drawingToolsManager.restrictionManager.rayTrace(ray);
            // add at last position
            this.addPoint(this.#positionArray.length / 3, restrictedPoint);

            this.#insertionActive = true;
            this.#alreadyInserted = true;
        }
    }

    public onKeyUp(event: KeyboardEvent): void {
        if (this.#drawingToolsManager.keyPressed(event, this.#drawingToolsManager.customizationProperties.controls.insert)) {
            this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = false;
        }

        if (this.#drawingToolsManager.keyPressed(event, this.#drawingToolsManager.customizationProperties.controls.insert) && this.#insertionActive === true) {
            // remove last added point
            this.removePoint(this.#positionArray.length / 3 - 1);
            this.#insertionActive = false;
            this.#alreadyInserted = false;
        }
    }

    public onMove(event: MouseEvent | TouchEvent, ray: IRay): void {
        this.#lastEvent = event;

        if (this.#drawingToolsManager.keyPressed(event as MouseEvent, this.#drawingToolsManager.customizationProperties.controls.insert)) {
            this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = true;
        }

        if (this.#drawingToolsManager.keyPressed(event as MouseEvent, this.#drawingToolsManager.customizationProperties.controls.insert) && this.#insertionActive === false && this.#alreadyInserted === false) {
            // get current ray
            const ray = this.#lastEvent instanceof MouseEvent ? this.#drawingToolsManager.viewport.mouseEventToRay(this.#lastEvent) : this.#drawingToolsManager.viewport.touchEventToRay(this.#lastEvent);

            // add a point at the ray intersection
            const restrictedPoint = this.#drawingToolsManager.restrictionManager.rayTrace(ray);
            // add at last position
            this.addPoint(this.#positionArray.length / 3, restrictedPoint);

            this.#insertionActive = true;
            this.#alreadyInserted = true;
        } else if (this.#positionArray.length > 0 && this.#insertionActive === true) {
            const restrictedPoint = this.#drawingToolsManager.restrictionManager.rayTrace(ray, this.#positionArray.length / 3 - 1);
            this.movePoint(this.#positionArray.length / 3 - 1, restrictedPoint, false);
        }
    }

    public removePoint(removalIndex: number): void {
        const positionArrayLength = this.#positionArray.length / 3;
        if (removalIndex < 0 || removalIndex >= positionArrayLength) {
            throw new Error('TODO');
        }

        /**
         * Adjust the position attribute
         * 
         * Logic:
         *  - remove :D
         */
        const newPositionArray = new Float32Array(this.#positionArray.length - 3);
        if (removalIndex > 0 && removalIndex < positionArrayLength) {
            newPositionArray.set([...this.#positionArray.slice(0, Math.max(removalIndex, 0) * 3), ...this.#positionArray.slice(Math.min(removalIndex + 1, this.#positionArray.length) * 3, this.#positionArray.length)]);
        } else if (removalIndex === 0) {
            newPositionArray.set(this.#positionArray.slice(3, this.#positionArray.length - 1));
        } else {
            newPositionArray.set(this.#positionArray.slice(0, this.#positionArray.length - 1 - 3));
        }

        this.#positionArray = newPositionArray;

        /**
         * Adjust the Indices if there are any
         * 
         * Logic:
         *  - remove all lines that include the removal index
         *  - shift the indices with a higher index one forward, as the array will be one smaller after
         */
        if (this.#indicesArrayLines && this.#geometryDataLines)
            this.createLineIndices(true);

        this.createAndSetPositionIndexArray();

        // remove material index at position of removal index
        this.#materialIndexArray.splice(removalIndex, 1);

        this.#geometryDataPoints.primitive.attributes['POSITION'] =
            new AttributeData(
                newPositionArray,
                this.#geometryDataPoints.primitive.attributes['POSITION'].itemSize,
                this.#geometryDataPoints.primitive.attributes['POSITION'].itemBytes,
                this.#geometryDataPoints.primitive.attributes['POSITION'].byteOffset,
                this.#geometryDataPoints.primitive.attributes['POSITION'].elementBytes,
                this.#geometryDataPoints.primitive.attributes['POSITION'].normalized,
                this.#geometryDataPoints.primitive.attributes['POSITION'].count - 1
            );
        this.#geometryDataPoints.updateVersion();
        this.#geometryDataPoints.primitive.updateVersion();

        if (this.#geometryDataLines) {
            this.#geometryDataLines.primitive.attributes['POSITION'] =
                new AttributeData(
                    newPositionArray,
                    this.#geometryDataLines.primitive.attributes['POSITION'].itemSize,
                    this.#geometryDataLines.primitive.attributes['POSITION'].itemBytes,
                    this.#geometryDataLines.primitive.attributes['POSITION'].byteOffset,
                    this.#geometryDataLines.primitive.attributes['POSITION'].elementBytes,
                    this.#geometryDataLines.primitive.attributes['POSITION'].normalized,
                    this.#geometryDataLines.primitive.attributes['POSITION'].count - 1
                );
            this.#geometryDataLines.updateVersion();
            this.#geometryDataLines.primitive.updateVersion();
        }

        this.#parentNode.updateVersion();
    }

    public updateMaterialIndex(index: number, materialIndex: number): void {
        // change material index
        this.#materialIndexArray[index] = materialIndex;
        const threeJsPointsGeometry: THREE.Points = this.#geometryDataPoints.threeJsObject[this.#drawingToolsManager.viewport.id] as THREE.Points;
        (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.image.data[index] = materialIndex;
        (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.needsUpdate = true;
        (threeJsPointsGeometry.material as MultiPointsMaterial).needsUpdate = true;
    }

    // #endregion Public Methods (9)

    // #region Private Methods (2)

    private createAndSetPositionIndexArray(): Float32Array {
        const positionIndexArray = new Float32Array((this.#positionArray.length / 3));
        // fill position index array with indices
        for (let i = 0; i < positionIndexArray.length; i++) {
            positionIndexArray.set([i], i);
        }

        this.#positionIndexArray = positionIndexArray;
        this.#geometryDataPoints.primitive.attributes['POSITION_INDEX'] = new AttributeData(this.#positionIndexArray, 1, 1, 0, 1, true, this.#positionIndexArray.length, [0], [this.#positionIndexArray.length]);
        if (this.#geometryDataLines) this.#geometryDataLines.primitive.attributes['POSITION_INDEX'] = new AttributeData(this.#positionIndexArray, 1, 1, 0, 1, true, this.#positionIndexArray.length, [0], [this.#positionIndexArray.length]);
        return positionIndexArray;
    }

    /**
     * Creates the indices array for the lines
     * Each line segment consists of two indices, start and end point
     * 
     * optionally connect the last point with the first point
     */
    private createLineIndices(loop: boolean): void {
        if (!this.#geometryDataLines || !this.#indicesArrayLines) return;

        const positionArrayLength = this.#positionArray.length / 3;

        this.#indicesArrayLines = new Uint8Array(positionArrayLength * 2);

        // create indices array
        for (let i = 0; i < positionArrayLength - 1; i++) {
            this.#indicesArrayLines.set([i, i + 1], i * 2);
        }

        if (loop) {
            // connect the last point with the first point
            const tempIndicesArray = new Uint8Array(this.#indicesArrayLines.length + 2);
            tempIndicesArray.set([...this.#indicesArrayLines, positionArrayLength - 1, 0]);
            this.#indicesArrayLines = tempIndicesArray;
        }

        this.#geometryDataLines.primitive.indices =
            new AttributeData(
                this.#indicesArrayLines,
                this.#geometryDataLines.primitive.indices!.itemSize,
                this.#geometryDataLines.primitive.indices!.itemBytes,
                this.#geometryDataLines.primitive.indices!.byteOffset,
                this.#geometryDataLines.primitive.indices!.elementBytes,
                this.#geometryDataLines.primitive.indices!.normalized,
                this.#indicesArrayLines.length
            );

        this.#geometryDataLines!.primitive.updateVersion();
    }

    // #endregion Private Methods (2)
}