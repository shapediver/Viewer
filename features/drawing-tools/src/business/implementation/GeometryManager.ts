import {
    AttributeData,
    GeometryData,
    IGeometryData,
    IMapData,
    MapData,
    MATERIAL_ALPHA,
    MaterialBasicLineData,
    MaterialMultiPointData,
    PRIMITIVE_MODE,
    PrimitiveData
} from '@shapediver/viewer.shared.types';
import { DrawingToolsManager, PointsData } from './DrawingToolsManager';
import { IManager } from '../interfaces/IManager';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { MultiPointsMaterial } from '@shapediver/viewer.rendering-engine-threejs.standard';
import { ShapeDiverViewerDrawingToolsError } from '@shapediver/viewer';
import { vec3 } from 'gl-matrix';

// #region Classes (1)

export class GeometryManager implements IManager {
    // #region Properties (10)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #parentNode: ITreeNode;

    #closeLoop: boolean = false;
    #geometryDataLines?: IGeometryData;
    #geometryDataPoints: IGeometryData;
    #indicesArrayLines?: Uint8Array | null;
    #materialIndexArray: number[] = [];
    #positionArray: Float32Array;
    #positionIndexArray: Float32Array;
    #wasWithinMinimumMaximumPointsRange: boolean = false;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawingToolsManager;
        const geometryProperties = this.#drawingToolsManager.settings.geometry!;

        // create a new node with the geometry data
        const parentNode = new TreeNode('DrawingToolsGeometry');
        this.#drawingToolsManager.parentNode.addChild(parentNode);

        this.#parentNode = parentNode;

        if (geometryProperties.points.length > 0) {
            this.#positionArray = new Float32Array(geometryProperties.points.length * 3);
            this.#positionArray.set(([] as number[]).concat(...geometryProperties.points));
        } else {
            this.#positionArray = new Float32Array();
        }

        this.#geometryDataPoints = new GeometryData(
            new PrimitiveData({
                'POSITION': new AttributeData(this.#positionArray, 3, 12, 0, 4, false, this.#positionArray.length)
            }),
            PRIMITIVE_MODE.POINTS
        );
        this.#geometryDataPoints.renderOrder = 1000;
        parentNode.addData(this.#geometryDataPoints);

        if (geometryProperties.mode !== 'points') {
            this.#indicesArrayLines = new Uint8Array();
            this.#geometryDataLines = new GeometryData(
                new PrimitiveData({
                    'POSITION': new AttributeData(this.#positionArray, 3, 12, 0, 4, false, this.#positionArray.length)
                },
                    new AttributeData(this.#indicesArrayLines, 1, 2, 0, 2, false, 0)),
                PRIMITIVE_MODE.LINES
            );
            this.#geometryDataLines.renderOrder = 999;
            parentNode.addData(this.#geometryDataLines);
            this.createLineIndices(this.#drawingToolsManager.settings.geometry.close && this.#drawingToolsManager.settings.geometry.autoClose);
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
                this.#drawingToolsManager.settings.visualization.points
            )
        );
        const updateMaterialVariation = (variations: string[], map: IMapData) => {
            for (const v of variations) {
                (this.#geometryDataPoints.material as unknown as { [key: string]: unknown })[v as keyof MaterialMultiPointData] = map;
            }
            (this.#geometryDataPoints.material as MaterialMultiPointData).updateVersion();
            this.#geometryDataPoints.updateVersion();
            this.updateParentNode();
        };

        const variation_0 = ['map_0', 'map_1', 'map_4', 'map_5', 'map_6', 'map_7'];
        const variation_1 = ['map_2', 'map_3'];

        if (this.#drawingToolsManager.defaultTextures.variation_0 instanceof MapData) {
            updateMaterialVariation(variation_0, this.#drawingToolsManager.defaultTextures.variation_0);
        } else {
            (this.#drawingToolsManager.defaultTextures.variation_0 as Promise<IMapData>).then((map) => {
                updateMaterialVariation(variation_0, map);
            });
        }

        if (this.#drawingToolsManager.defaultTextures.variation_1 instanceof MapData) {
            updateMaterialVariation(variation_1, this.#drawingToolsManager.defaultTextures.variation_1);
        } else {
            (this.#drawingToolsManager.defaultTextures.variation_1 as Promise<IMapData>).then((map) => {
                updateMaterialVariation(variation_1, map);
            });
        }

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
                    this.#drawingToolsManager.settings.visualization.lines
                )
            );
            this.#geometryDataLines.primitive.updateVersion();
            this.#geometryDataLines.updateVersion();
        }

        this.updateParentNode();

        // check if the number of points is within the minimum and maximum range
        this.#wasWithinMinimumMaximumPointsRange = this.checkNumberOfPoints();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (9)

    public get closeLoop(): boolean {
        return this.#closeLoop;
    }

    public set closeLoop(value: boolean) {
        this.#closeLoop = value;
    }

    public get geometryData(): IGeometryData {
        return this.#geometryDataPoints;
    }

    public get indicesArrayLines(): Uint8Array | null | undefined {
        return this.#indicesArrayLines;
    }

    public get materialIndexArray(): number[] {
        return this.#materialIndexArray;
    }

    public get pointsLength(): number {
        return this.#positionArray.length / 3;
    }

    public get positionArray(): Float32Array {
        return this.#positionArray;
    }

    public get positionIndexArray(): Float32Array {
        return this.#positionIndexArray;
    }

    public get wasWithinMinimumMaximumPointsRange(): boolean {
        return this.#wasWithinMinimumMaximumPointsRange;
    }

    // #endregion Public Getters And Setters (9)

    // #region Public Methods (13)

    public addPoint(insertionIndex: number, position?: vec3 | undefined): void {
        const positionArrayLength = this.#positionArray.length / 3;
        const scaledIndex = insertionIndex * 3;
        if (insertionIndex < 0 || insertionIndex > positionArrayLength) {
            throw new ShapeDiverViewerDrawingToolsError('The insertion index is out of range. Please provide a valid index.');
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
            this.createLineIndices(this.#closeLoop || (this.#drawingToolsManager.settings.geometry.close && this.#drawingToolsManager.settings.geometry.autoClose));

        this.#geometryDataPoints.primitive.attributes['POSITION'] = new AttributeData(this.#positionArray, this.#geometryDataPoints.primitive.attributes['POSITION'].itemSize, this.#geometryDataPoints.primitive.attributes['POSITION'].itemBytes, this.#geometryDataPoints.primitive.attributes['POSITION'].byteOffset, this.#geometryDataPoints.primitive.attributes['POSITION'].elementBytes, this.#geometryDataPoints.primitive.attributes['POSITION'].normalized, this.#geometryDataPoints.primitive.attributes['POSITION'].count + 1);
        if (this.#geometryDataLines) this.#geometryDataLines.primitive.attributes['POSITION'] = new AttributeData(this.#positionArray, this.#geometryDataLines.primitive.attributes['POSITION'].itemSize, this.#geometryDataLines.primitive.attributes['POSITION'].itemBytes, this.#geometryDataLines.primitive.attributes['POSITION'].byteOffset, this.#geometryDataLines.primitive.attributes['POSITION'].elementBytes, this.#geometryDataLines.primitive.attributes['POSITION'].normalized, this.#geometryDataLines.primitive.attributes['POSITION'].count + 1);

        this.createAndSetPositionIndexArray();

        // set the material index at that point to 0 and move the other indices back
        this.#materialIndexArray = this.#materialIndexArray.slice(0, insertionIndex).concat([0], this.#materialIndexArray.slice(insertionIndex, this.#materialIndexArray.length));

        const threeJsPointsGeometry: THREE.Points = this.#geometryDataPoints.threeJsObject[this.#drawingToolsManager.viewport.id] as THREE.Points;
        for (let i = 0; i < this.#materialIndexArray.length; i++)
            (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.image.data[i] = this.#materialIndexArray[i];
        (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.needsUpdate = true;
        (threeJsPointsGeometry.material as MultiPointsMaterial).needsUpdate = true;

        (this.#geometryDataPoints.material as MaterialMultiPointData).materialIndexDataMap = new MapData(new Image(), { asData: true, data: this.#materialIndexArray }),
            this.#geometryDataPoints.material!.updateVersion();

        this.#geometryDataPoints.updateVersion();
        this.#geometryDataPoints.primitive.updateVersion();
        if (this.#geometryDataLines) {
            this.#geometryDataLines.updateVersion();
            this.#geometryDataLines.primitive.updateVersion();
        }
        this.updateParentNode();

        this.#drawingToolsManager.textVisualizationManager.createPointLabels();
        this.#drawingToolsManager.textVisualizationManager.createDistanceLabels();

        // check if the number of points is within the minimum and maximum range
        this.#wasWithinMinimumMaximumPointsRange = this.checkNumberOfPoints();
    }

    public canAddPoint(): boolean {
        return this.#drawingToolsManager.settings.geometry.maxPoints !== undefined &&
            this.pointsLength < this.#drawingToolsManager.settings.geometry.maxPoints &&
            this.wasWithinMinimumMaximumPointsRange &&
            this.#drawingToolsManager.settings.geometry.strictMinMaxPoints === true;
    }

    public canRemovePoint(): boolean {
        return this.#drawingToolsManager.settings.geometry.minPoints !== undefined &&
            this.pointsLength > this.#drawingToolsManager.settings.geometry.minPoints &&
            this.wasWithinMinimumMaximumPointsRange &&
            this.#drawingToolsManager.settings.geometry.strictMinMaxPoints === true;
    }

    public checkMaximumNumberOfPoints(number?: number): boolean {
        if (number === undefined) number = this.#positionArray.length / 3;
        if (this.#drawingToolsManager.settings.geometry.maxPoints === undefined) return true;
        return number <= this.#drawingToolsManager.settings.geometry.maxPoints;
    }

    public checkMinimumNumberOfPoints(number?: number): boolean {
        if (number === undefined) number = this.#positionArray.length / 3;
        if (this.#drawingToolsManager.settings.geometry.minPoints === undefined) return true;
        return number >= this.#drawingToolsManager.settings.geometry.minPoints;
    }

    public checkNumberOfPoints(number?: number): boolean {
        return this.checkMinimumNumberOfPoints(number) && this.checkMaximumNumberOfPoints(number);
    }

    public close(): void {
        this.#parentNode.removeData(this.#geometryDataPoints);

        if (this.#geometryDataLines)
            this.#parentNode.removeData(this.#geometryDataLines);

        this.#drawingToolsManager.parentNode.removeChild(this.#parentNode);
        this.#drawingToolsManager.parentNode.updateVersion();
    }

    /**
     * Creates the indices array for the lines
     * Each line segment consists of two indices, start and end point
     * 
     * optionally connect the last point with the first point
     */
    public createLineIndices(loop: boolean): void {
        if (!this.#geometryDataLines || !this.#indicesArrayLines) return;

        const positionArrayLength = this.#positionArray.length / 3;

        if (positionArrayLength < 1) return;

        this.#indicesArrayLines = new Uint8Array((positionArrayLength - 1) * 2);

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
        this.#geometryDataLines!.updateVersion();

        this.updateParentNode();
    }

    public getPointsData(): PointsData {
        const points = [];
        for (let i = 0; i < this.#positionArray.length; i += 3) {
            points.push([this.#positionArray[i], this.#positionArray[i + 1], this.#positionArray[i + 2]]);
        }
        return points;
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

        this.#drawingToolsManager.textVisualizationManager.createPointLabels();
        this.#drawingToolsManager.textVisualizationManager.createDistanceLabels();
    }

    public removePoint(removalIndex: number): void {
        const positionArrayLength = this.#positionArray.length / 3;
        if (removalIndex < 0 || removalIndex >= positionArrayLength) {
            throw new ShapeDiverViewerDrawingToolsError('The removal index is out of range. Please provide a valid index.');
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
            newPositionArray.set(this.#positionArray.slice(3, this.#positionArray.length));
        } else {
            newPositionArray.set(this.#positionArray.slice(0, this.#positionArray.length - 3));
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
            this.createLineIndices(this.#closeLoop || (this.#drawingToolsManager.settings.geometry.close && this.#drawingToolsManager.settings.geometry.autoClose));

        this.createAndSetPositionIndexArray();

        // remove material index
        this.#materialIndexArray = this.#materialIndexArray.slice(0, removalIndex).concat(this.#materialIndexArray.slice(removalIndex + 1, this.#materialIndexArray.length));
        // add a new material index at the end
        this.#materialIndexArray.push(0);

        const threeJsPointsGeometry: THREE.Points = this.#geometryDataPoints.threeJsObject[this.#drawingToolsManager.viewport.id] as THREE.Points;
        for (let i = 0; i < this.#materialIndexArray.length; i++)
            (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.image.data[i] = this.#materialIndexArray[i];
        (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.needsUpdate = true;
        (threeJsPointsGeometry.material as MultiPointsMaterial).needsUpdate = true;

        (this.#geometryDataPoints.material as MaterialMultiPointData).materialIndexDataMap = new MapData(new Image(), { asData: true, data: this.#materialIndexArray }),
            this.#geometryDataPoints.material!.updateVersion();

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

        this.updateParentNode();

        this.#drawingToolsManager.textVisualizationManager.createPointLabels();
        this.#drawingToolsManager.textVisualizationManager.createDistanceLabels();

        // check if the number of points is within the minimum and maximum range
        this.#wasWithinMinimumMaximumPointsRange = this.checkNumberOfPoints();
    }

    public resetMaterialIndices(): void {
        this.#materialIndexArray = new Array(this.#materialIndexArray.length).fill(0);

        const threeJsPointsGeometry: THREE.Points = this.#geometryDataPoints.threeJsObject[this.#drawingToolsManager.viewport.id] as THREE.Points;
        for (let i = 0; i < this.#materialIndexArray.length; i++)
            (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.image.data[i] = 0;
        (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.needsUpdate = true;
        (threeJsPointsGeometry.material as MultiPointsMaterial).needsUpdate = true;
    }

    public updateMaterialIndex(index: number, materialIndex: MATERIAL_INDEX): void {
        // change material index
        this.#materialIndexArray[index] = materialIndex;
        const threeJsPointsGeometry: THREE.Points = this.#geometryDataPoints.threeJsObject[this.#drawingToolsManager.viewport.id] as THREE.Points;
        (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.image.data[index] = materialIndex;
        (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.needsUpdate = true;
        (threeJsPointsGeometry.material as MultiPointsMaterial).needsUpdate = true;
    }

    // #endregion Public Methods (13)

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

    private updateParentNode(): void {
        this.#parentNode.updateVersion(false, true);
        this.#drawingToolsManager.viewport.updateNode(this.#parentNode);
    }

    // #endregion Private Methods (2)
}

// #endregion Classes (1)

// #region Enums (1)

export enum MATERIAL_INDEX {
    DEFAULT = 0,
    HOVERED = 1,
    SELECTED = 2,
    SELECTED_HOVERED = 3,
    DELETION_HOVERED = 4,
    INSERTION = 5,
    INSERTION_HOVERED = 6
}

// #endregion Enums (1)
