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
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { MultiPointsMaterial } from '@shapediver/viewer.rendering-engine-threejs.standard';
import { MaterialEngine, sceneTree, sessions } from '@shapediver/viewer';
import { vec3 } from 'gl-matrix';

export class GeometryManager implements IManager {
    // #region Properties (11)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #parentNode: ITreeNode;

    #geometryDataLines?: IGeometryData;
    #geometryDataPoints: IGeometryData;
    #indicesArrayLines?: Uint8Array | null;
    #materialIndexArray: number[] = [];
    #positionArray: Float32Array;
    #positionIndexArray: Float32Array;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawingToolsManager;

        if (this.#drawingToolsManager.customizationProperties.geometry.parentNode !== undefined) {
            // search for the node that contains the geometry data
            let parentNode = sceneTree.root.getNodesByName(this.#drawingToolsManager.customizationProperties.geometry.parentNode)[0];

            if (!parentNode) {
                // search for the first Output with that name and use the first node
                for(const s in sessions) {
                    const outputs = sessions[s].getOutputByName(this.#drawingToolsManager.customizationProperties.geometry.parentNode);
                    if(outputs.length > 0) {
                        parentNode = outputs[0].node!;
                        break;
                    }
                }

                if(!parentNode)
                    throw new Error('The node with the name ' + this.#drawingToolsManager.customizationProperties.geometry.parentNode + ' does not exist. Please check the name of the node in the scene tree.');
            }

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
            this.#positionArray = geometryData.primitive.attributes['POSITION'].array as Float32Array;

            if (geometryData.mode === PRIMITIVE_MODE.POINTS) {
                this.#geometryDataPoints = geometryData;
            } else {
                this.#indicesArrayLines = geometryData.primitive.indices ? geometryData.primitive.indices.array as Uint8Array : null;

                if(this.#positionArray.length >= 6 && geometryData.mode === PRIMITIVE_MODE.LINES) {
                    // clean position array, if first element is same as last element
                    const firstPoint = vec3.fromValues(this.#positionArray[0], this.#positionArray[1], this.#positionArray[2]);
                    const lastPoint = vec3.fromValues(this.#positionArray[this.#positionArray.length - 3], this.#positionArray[this.#positionArray.length - 2], this.#positionArray[this.#positionArray.length - 1]);

                    if(vec3.equals(firstPoint, lastPoint)) {
                        this.#positionArray = this.#positionArray.slice(0, this.#positionArray.length - 3);
                        geometryData.primitive.attributes['POSITION'] = new AttributeData(
                            this.#positionArray,
                            geometryData.primitive.attributes['POSITION'].itemSize,
                            geometryData.primitive.attributes['POSITION'].itemBytes,
                            geometryData.primitive.attributes['POSITION'].byteOffset,
                            geometryData.primitive.attributes['POSITION'].elementBytes,
                            geometryData.primitive.attributes['POSITION'].normalized,
                            geometryData.primitive.attributes['POSITION'].count - 1
                        );
                    }
                }

                this.#geometryDataLines = geometryData;
                this.createLineIndices(true);

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

        const map0 = (this.#drawingToolsManager.customizationProperties.visualizationOptions.points as any).map_0 as string || 'https://viewer.shapediver.com/v3/graphics/point_soft.png';
        MaterialEngine.instance.loadMap(map0).then((map) => {
            if(map) {
                (this.#geometryDataPoints.material as MaterialMultiPointData).map_0 = map;
                (this.#geometryDataPoints.material as MaterialMultiPointData).updateVersion();
                this.#geometryDataPoints.updateVersion();
                this.updateParentNode();
            }
        });

        const map1 = (this.#drawingToolsManager.customizationProperties.visualizationOptions.points as any).map_1 as string || 'https://viewer.shapediver.com/v3/graphics/point_soft.png';
        MaterialEngine.instance.loadMap(map1).then((map) => {
            if(map) {
                (this.#geometryDataPoints.material as MaterialMultiPointData).map_1 = map;
                (this.#geometryDataPoints.material as MaterialMultiPointData).updateVersion();
                this.#geometryDataPoints.updateVersion();
                this.updateParentNode();
            }
        });

        const map2 = (this.#drawingToolsManager.customizationProperties.visualizationOptions.points as any).map_2 as string || 'https://viewer.shapediver.com/v3/graphics/point_soft_v2.png';
        MaterialEngine.instance.loadMap(map2).then((map) => {
            if(map) {
                (this.#geometryDataPoints.material as MaterialMultiPointData).map_2 = map;
                (this.#geometryDataPoints.material as MaterialMultiPointData).updateVersion();
                this.#geometryDataPoints.updateVersion();
                this.updateParentNode();
            }
        });

        const map3 = (this.#drawingToolsManager.customizationProperties.visualizationOptions.points as any).map_3 as string || 'https://viewer.shapediver.com/v3/graphics/point_soft_v2.png';
        MaterialEngine.instance.loadMap(map3).then((map) => {
            if(map) {
                (this.#geometryDataPoints.material as MaterialMultiPointData).map_3 = map;
                (this.#geometryDataPoints.material as MaterialMultiPointData).updateVersion();
                this.#geometryDataPoints.updateVersion();
                this.updateParentNode();
            }
        });

        const map4 = (this.#drawingToolsManager.customizationProperties.visualizationOptions.points as any).map_4 as string || 'https://viewer.shapediver.com/v3/graphics/point_soft.png';
        MaterialEngine.instance.loadMap(map4).then((map) => {
            if(map) {
                (this.#geometryDataPoints.material as MaterialMultiPointData).map_4 = map;
                (this.#geometryDataPoints.material as MaterialMultiPointData).updateVersion();
                this.#geometryDataPoints.updateVersion();
                this.updateParentNode();
            }
        });

        const map5 = (this.#drawingToolsManager.customizationProperties.visualizationOptions.points as any).map_5 as string || 'https://viewer.shapediver.com/v3/graphics/point_soft.png';
        MaterialEngine.instance.loadMap(map5).then((map) => {
            if(map) {
                (this.#geometryDataPoints.material as MaterialMultiPointData).map_5 = map;
                (this.#geometryDataPoints.material as MaterialMultiPointData).updateVersion();
                this.#geometryDataPoints.updateVersion();
                this.updateParentNode();
            }
        });

        const map6 = (this.#drawingToolsManager.customizationProperties.visualizationOptions.points as any).map_6 as string || 'https://viewer.shapediver.com/v3/graphics/point_soft.png';
        MaterialEngine.instance.loadMap(map6).then((map) => {
            if(map) {
                (this.#geometryDataPoints.material as MaterialMultiPointData).map_6 = map;
                (this.#geometryDataPoints.material as MaterialMultiPointData).updateVersion();
                this.#geometryDataPoints.updateVersion();
                this.updateParentNode();
            }
        });

        const map7 = (this.#drawingToolsManager.customizationProperties.visualizationOptions.points as any).map_7 as string || 'https://viewer.shapediver.com/v3/graphics/point_soft.png';
        MaterialEngine.instance.loadMap(map7).then((map) => {
            if(map) {
                (this.#geometryDataPoints.material as MaterialMultiPointData).map_7 = map;
                (this.#geometryDataPoints.material as MaterialMultiPointData).updateVersion();
                this.#geometryDataPoints.updateVersion();
                this.updateParentNode();
            }
        });

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

    public get indicesArrayLines(): Uint8Array | null | undefined {
        return this.#indicesArrayLines;
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

    public get indicesArrayLines(): Uint8Array | null | undefined {
        return this.#indicesArrayLines;
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
        this.#materialIndexArray = this.#materialIndexArray.slice(0, insertionIndex).concat([0], this.#materialIndexArray.slice(insertionIndex, this.#materialIndexArray.length-1));

        const threeJsPointsGeometry: THREE.Points = this.#geometryDataPoints.threeJsObject[this.#drawingToolsManager.viewport.id] as THREE.Points;
        for(let i = 0; i < this.#materialIndexArray.length; i++) 
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

        this.#drawingToolsManager.textVisualizationManager.createPointLabels();
        this.#drawingToolsManager.textVisualizationManager.createDistanceLabels();
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

        // remove material index
        this.#materialIndexArray = this.#materialIndexArray.slice(0, removalIndex).concat(this.#materialIndexArray.slice(removalIndex + 1, this.#materialIndexArray.length));
        // add a new material index at the end
        this.#materialIndexArray.push(0);

        const threeJsPointsGeometry: THREE.Points = this.#geometryDataPoints.threeJsObject[this.#drawingToolsManager.viewport.id] as THREE.Points;
        for(let i = 0; i < this.#materialIndexArray.length; i++) 
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
    }

    public resetMaterialIndices(): void {
        this.#materialIndexArray = new Array(this.#materialIndexArray.length).fill(0);

        const threeJsPointsGeometry: THREE.Points = this.#geometryDataPoints.threeJsObject[this.#drawingToolsManager.viewport.id] as THREE.Points;
        for(let i = 0; i < this.#materialIndexArray.length; i++) 
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

    // #endregion Public Methods (6)

    // #region Private Methods (3)

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

        if(positionArrayLength < 1) return;

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

    private updateParentNode(): void {
        this.#parentNode.updateVersion(false, true);
        this.#drawingToolsManager.viewport.updateNode(this.#parentNode);
    }

    // #endregion Private Methods (3)
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
