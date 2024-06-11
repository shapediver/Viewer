import * as THREE from 'three';
import {
    addListener,
    EVENTTYPE_DRAWING_TOOLS,
    ITreeNode,
    IViewportApi
} from '@shapediver/viewer';
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
import {
    DefaultTextures,
    DrawingToolsManager,
    PointsData,
    Settings
} from '../../DrawingToolsManager';
import { DrawingToolsEventResponseMapping } from '../../../interfaces/events/EventResponseMapping';
import { EventEngine, IEvent } from '@shapediver/viewer.shared.services';
import { GeometryManager } from './GeometryManager';
import { MultiPointsMaterial } from '@shapediver/viewer.rendering-engine.rendering-engine-threejs';
import { vec3 } from 'gl-matrix';
export class GeometryState {
    // #region Properties (15)

    readonly #eventEngine: EventEngine = EventEngine.instance;
    readonly #geometryManager: GeometryManager;
    readonly #parentNode: ITreeNode;
    readonly #settings: Settings;
    readonly #viewport: IViewportApi;

    #closeLoop: boolean = false;
    #defaultTextures: DefaultTextures;
    #geometryDataLines?: IGeometryData;
    #geometryDataPoints!: IGeometryData;
    #indicesArrayLines?: Uint8Array | null;
    #materialIndexArray: number[] = [];
    #positionArray!: Float32Array;
    #positionIndexArray!: Float32Array;
    #temporaryIndices: number[] = [];
    #wasWithinMinimumMaximumPointsRange: boolean = false;

    // #endregion Properties (15)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, geometryManager: GeometryManager) {
        this.#geometryManager = geometryManager;

        this.#settings = drawingToolsManager.settings;
        this.#viewport = drawingToolsManager.viewport;
        this.#parentNode = geometryManager.parentNode;

        this.#defaultTextures = drawingToolsManager.defaultTextures;

        addListener(EVENTTYPE_DRAWING_TOOLS.ADDED, (e: IEvent) => {
            const event = e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.ADDED];
            if (event.temporary === false && event.index !== undefined) {
                // shift the temporary indices
                this.#temporaryIndices = this.#temporaryIndices.map(i => i > event.index! ? i + 1 : i);
            } else if (event.temporary === true && event.index !== undefined) {
                this.#temporaryIndices.push(event.index!);
            }
        });

        addListener(EVENTTYPE_DRAWING_TOOLS.REMOVED, (e: IEvent) => {
            const event = e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.REMOVED];
            if (event.temporary === false && event.index !== undefined) {
                // shift the temporary indices
                this.#temporaryIndices = this.#temporaryIndices.map(i => i > event.index! ? i - 1 : i);
            } else if (event.temporary === true && event.index !== undefined) {
                this.#temporaryIndices = this.#temporaryIndices.filter(i => i !== event.index);
            }
        });
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (12)

    public get closeLoop(): boolean {
        return this.#closeLoop;
    }

    public set closeLoop(value: boolean) {
        this.#closeLoop = value;
        this.updateData(this.#positionArray, true);
    }

    public get geometryData(): IGeometryData {
        return this.#geometryDataPoints;
    }

    public get geometryDataLines(): IGeometryData | undefined {
        return this.#geometryDataLines;
    }

    public get geometryDataPoints(): IGeometryData {
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

    public set wasWithinMinimumMaximumPointsRange(value: boolean) {
        this.#wasWithinMinimumMaximumPointsRange = value;
    }

    // #endregion Public Getters And Setters (12)

    // #region Public Methods (17)

    public canAddPoint(number: number = 1): boolean {
        return this.#settings.geometry.maxPoints !== undefined &&
            this.pointsLength + number <= this.#settings.geometry.maxPoints &&
            this.wasWithinMinimumMaximumPointsRange &&
            this.#settings.geometry.strictMinMaxPoints === true;
    }

    public canRemovePoint(number: number = 1): boolean {
        return this.#settings.geometry.minPoints !== undefined &&
            this.pointsLength - number >= this.#settings.geometry.minPoints &&
            this.wasWithinMinimumMaximumPointsRange &&
            this.#settings.geometry.strictMinMaxPoints === true;
    }

    public checkMaximumNumberOfPoints(number?: number): boolean {
        if (number === undefined) number = this.#positionArray.length / 3;
        if (this.#settings.geometry.maxPoints === undefined) return true;
        return number <= this.#settings.geometry.maxPoints;
    }

    public checkMinimumNumberOfPoints(number?: number): boolean {
        if (number === undefined) number = this.#positionArray.length / 3;
        if (this.#settings.geometry.minPoints === undefined) return true;
        return number >= this.#settings.geometry.minPoints;
    }

    public checkNumberOfPoints(number?: number): boolean {
        return this.checkMinimumNumberOfPoints(number) && this.checkMaximumNumberOfPoints(number);
    }

    public close() {
        this.#parentNode.removeData(this.#geometryDataPoints);

        if (this.#geometryDataLines)
            this.#parentNode.removeData(this.#geometryDataLines);
    }

    public convertToFloat32Array(points: PointsData): Float32Array {
        const positionArray = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
            positionArray.set(points[i], i * 3);
        }
        return positionArray;
    }

    /**
     * Creates the indices array for the lines
     * Each line segment consists of two indices, start and end point
     * 
     * optionally connect the last point with the first point
     */
    public createLineIndices(loop: boolean): Uint8Array | undefined {
        if (!this.#geometryDataLines || !this.#indicesArrayLines) return;

        const positionArrayLength = this.#positionArray.length / 3;

        if (positionArrayLength < 1) return;

        let indicesArrayLines = new Uint8Array((positionArrayLength - 1) * 2);

        // create indices array
        for (let i = 0; i < positionArrayLength - 1; i++) {
            indicesArrayLines.set([i, i + 1], i * 2);
        }

        if (loop) {
            // connect the last point with the first point
            const tempIndicesArray = new Uint8Array(indicesArrayLines.length + 2);
            tempIndicesArray.set([...indicesArrayLines, positionArrayLength - 1, 0]);
            indicesArrayLines = tempIndicesArray;
        }

        return indicesArrayLines;
    }

    public getPointCount(): number {
        return this.pointsLength;
    }

    public getPointsData(): PointsData {
        const points = [];
        for (let i = 0; i < this.#positionArray.length; i += 3) {
            points.push([this.#positionArray[i], this.#positionArray[i + 1], this.#positionArray[i + 2]]);
        }
        return points;
    }

    public getPosition(index: number): vec3 {
        return vec3.fromValues(
            this.#positionArray[index]!,
            this.#positionArray[index + 1]!,
            this.#positionArray[index + 2]!
        );
    }

    public init() {
        const geometryProperties = this.#settings.geometry!;
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
        this.#parentNode.addData(this.#geometryDataPoints);

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
            this.#parentNode.addData(this.#geometryDataLines);
            this.createLineIndices(this.#settings.geometry.close && this.#settings.geometry.autoClose);
        }

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
                this.#settings.visualization.points
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

        const variation_0 = ['map_0', 'map_1', 'map_2', 'map_3', 'map_4', 'map_5', 'map_6', 'map_7'];

        if (this.#defaultTextures.variation_0 instanceof MapData) {
            updateMaterialVariation(variation_0, this.#defaultTextures.variation_0);
        } else {
            (this.#defaultTextures.variation_0 as Promise<IMapData>).then((map) => {
                updateMaterialVariation(variation_0, map);
            });
        }

        if (this.#geometryDataLines) {
            this.#geometryDataLines.material = new MaterialBasicLineData(
                Object.assign(
                    {
                        alphaMode: MATERIAL_ALPHA.BLEND,
                        depthTest: false,
                        depthWrite: false,
                        transparent: true
                    },
                    this.#settings.visualization.lines
                )
            );
        }

        this.updateData(this.#positionArray);
    }

    public makePointPersistent(index: number, recordHistory = true): void {
        // check if the number of points is within the minimum and maximum range
        this.wasWithinMinimumMaximumPointsRange = this.checkNumberOfPoints();

        // remove from the temporary indices
        this.#temporaryIndices = this.#temporaryIndices.filter(i => i !== index);

        this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED, {
            points: this.getPointsData(),
            temporary: false,
            fromHistory: recordHistory === false
        });
    }

    public updateData(
        positionArray: Float32Array,
        temporary: boolean = false,
        fromHistory: boolean = false
    ): void {
        this.#positionArray = positionArray;
        this.#positionIndexArray = this.createAndSetPositionIndexArray();

        this.geometryDataPoints.primitive.attributes['POSITION'] =
            new AttributeData(
                this.#positionArray,
                this.geometryDataPoints.primitive.attributes['POSITION'].itemSize,
                this.geometryDataPoints.primitive.attributes['POSITION'].itemBytes,
                this.geometryDataPoints.primitive.attributes['POSITION'].byteOffset,
                this.geometryDataPoints.primitive.attributes['POSITION'].elementBytes,
                this.geometryDataPoints.primitive.attributes['POSITION'].normalized,
                this.geometryDataPoints.primitive.attributes['POSITION'].count - 1
            );
        this.#geometryDataPoints.primitive.attributes['POSITION_INDEX'] = new AttributeData(this.#positionIndexArray, 1, 1, 0, 1, true, this.#positionIndexArray.length, [0], [this.#positionIndexArray.length]);
        this.geometryDataPoints.updateVersion();
        this.geometryDataPoints.primitive.updateVersion();

        if (this.geometryDataLines) {
            this.#indicesArrayLines = this.createLineIndices(this.#closeLoop || (this.#settings.geometry.close && this.#settings.geometry.autoClose));
            if (this.#indicesArrayLines) {
                this.geometryDataLines.primitive.indices =
                    new AttributeData(
                        this.#indicesArrayLines,
                        this.geometryDataLines.primitive.indices!.itemSize,
                        this.geometryDataLines.primitive.indices!.itemBytes,
                        this.geometryDataLines.primitive.indices!.byteOffset,
                        this.geometryDataLines.primitive.indices!.elementBytes,
                        this.geometryDataLines.primitive.indices!.normalized,
                        this.#indicesArrayLines.length
                    );
            }
            this.geometryDataLines.primitive.attributes['POSITION'] =
                new AttributeData(
                    this.#positionArray,
                    this.geometryDataLines.primitive.attributes['POSITION'].itemSize,
                    this.geometryDataLines.primitive.attributes['POSITION'].itemBytes,
                    this.geometryDataLines.primitive.attributes['POSITION'].byteOffset,
                    this.geometryDataLines.primitive.attributes['POSITION'].elementBytes,
                    this.geometryDataLines.primitive.attributes['POSITION'].normalized,
                    this.geometryDataLines.primitive.attributes['POSITION'].count - 1
                );
            this.geometryDataLines.primitive.attributes['POSITION_INDEX'] = new AttributeData(this.#positionIndexArray, 1, 1, 0, 1, true, this.#positionIndexArray.length, [0], [this.#positionIndexArray.length]);
            this.geometryDataLines.updateVersion();
            this.geometryDataLines.primitive.updateVersion();
        }
        this.updateParentNode();

        if (temporary === false) {
            // check if the number of points is within the minimum and maximum range
            this.wasWithinMinimumMaximumPointsRange = this.checkNumberOfPoints();
        }

        this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED, {
            points: this.getPointsData(),
            temporary,
            fromHistory
        });
    }

    public updateDataFromHistory(points: PointsData): void {
        const positionArray = this.convertToFloat32Array(points);
        this.updateData(positionArray, false, true);
    }

    public updateMaterialIndexArray(materialIndexArray: number[]): void {
        this.#materialIndexArray = materialIndexArray;

        const threeJsPointsGeometry: THREE.Points = this.#geometryDataPoints.convertedObject[this.#viewport.id] as THREE.Points;
        for (let i = 0; i < this.#materialIndexArray.length; i++)
            (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.image.data[i] = this.#materialIndexArray[i];
        (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.needsUpdate = true;
        (threeJsPointsGeometry.material as MultiPointsMaterial).needsUpdate = true;

        (this.#geometryDataPoints.material as MaterialMultiPointData).materialIndexDataMap = new MapData(new Image(), { asData: true, data: this.#materialIndexArray }),
            this.#geometryDataPoints.material!.updateVersion();
    }

    public updateParentNode(): void {
        this.#parentNode.updateVersion(false, true);
        this.#viewport.updateNode(this.#parentNode);
    }

    // #endregion Public Methods (17)

    // #region Private Methods (1)

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

    // #endregion Private Methods (1)
}