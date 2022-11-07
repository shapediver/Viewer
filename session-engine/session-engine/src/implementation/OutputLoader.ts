import { container } from 'tsyringe'
import { IMaterialAbstractData, GeometryData, AbstractMaterialData } from '@shapediver/viewer.shared.types'
import { DataEngine } from '@shapediver/viewer.data-engine.data-engine'
import { ITreeNode, Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'

import { OutputDelayException } from './OutputDelayException'
import { SessionTreeNode } from './SessionTreeNode'
import { SessionOutputData } from './SessionOutputData'
import { PerformanceEvaluator } from '@shapediver/viewer.shared.services'
import { ShapeDiverResponseDto, ShapeDiverResponseOutput } from '@shapediver/sdk.geometry-api-sdk-v2'
import { ISessionTreeNode } from '../interfaces/ISessionTreeNode'
import { ISessionEngine } from '../interfaces/ISessionEngine'

export class OutputLoader {
    // #region Properties (3)

    private readonly _dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);
    private readonly _loadedOutputNodes: { 
        [key: string]: {
            [key: string]: ISessionTreeNode
        }; 
    } = {};
    private readonly _lastOutputNodes: { 
        [key: string]: ISessionTreeNode
    } = {};
    private readonly _performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);

    // #endregion Properties (3)

    // #region Constructors (1)

    /**
     * The output loader takes care of loading the outputs of a session, storing them and returning stored or newly loaded nodes.
     * 
     * @param _session the session for this output loader
     */
    constructor(private readonly _sessionEngine: ISessionEngine) {}

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
     * Load the outputs and return the scene graph node of the result.
     * In case the outputs have a delay property, it throws an OutputDelayException.
     * 
     * @param outputs the outputs to load
     * @returns promise with a scene graph node
     */
     public async loadOutputs(nodeName: string, outputs: { [key: string]: ShapeDiverResponseOutput; }, outputsFreeze: { [key: string]: boolean; }): Promise<SessionTreeNode> {
        this._performanceEvaluator.startSection('outputLoading');
        const node = new SessionTreeNode(nodeName);
        let currentNodes: { 
            [key: string]: {
                [key: string]: ISessionTreeNode
            }; 
        } = {};
        let promises: Promise<ITreeNode>[] = [];
        let promisesNodes: ISessionTreeNode[] = [];
        let maxDelay = 0;

        for (let outputID in outputs) {
            currentNodes[outputID] = {};
            if(!this._loadedOutputNodes[outputID]) 
                this._loadedOutputNodes[outputID] = {};
             
            if(outputsFreeze[outputID]) {
                currentNodes[outputID][outputs[outputID].version] = this._lastOutputNodes[outputID];
            } else if(outputs[outputID].delay) {
                maxDelay = Math.max(maxDelay, outputs[outputID].delay!);
            } else if(!this._loadedOutputNodes[outputID][outputs[outputID].version]) {
                currentNodes[outputID][outputs[outputID].version] = new SessionTreeNode(outputID);
                currentNodes[outputID][outputs[outputID].version].data.push(new SessionOutputData(outputs[outputID]));
                if(outputs[outputID].content) {
                    for (let i = 0, len = outputs[outputID].content!.length; i < len; i++) {
                        promises.push(this._dataEngine.loadContent(outputs[outputID].content![i], this._sessionEngine.bearerToken))
                        promisesNodes.push(currentNodes[outputID][outputs[outputID].version])
                    }
                }
            } else {
                currentNodes[outputID][outputs[outputID].version] = this._loadedOutputNodes[outputID][outputs[outputID].version];
            }
        }

        if(maxDelay)
            throw new OutputDelayException(maxDelay);

        await Promise.all(promises);

        // all promises are resolved, await in the next lines is just for structural purposes
        for(let i = 0; i < promises.length; i++) 
            promisesNodes[i].addChild(await promises[i])

        // here we assign all outputs just to the node and return it
        for (let outputID in outputs) {
            node.addChild(currentNodes[outputID][outputs[outputID].version]);
        }

        // save the nodes as the last available version
        for (let outputID in outputs) {
            this._loadedOutputNodes[outputID] = {};
            this._loadedOutputNodes[outputID][outputs[outputID].version] = currentNodes[outputID][outputs[outputID].version];
            this._lastOutputNodes[outputID] = currentNodes[outputID][outputs[outputID].version];
        }

        for (let outputID in outputs) {
            if(currentNodes[outputID][outputs[outputID].version].children.length > 1) {
                for (let i = 0, len = outputs[outputID].content!.length; i < len; i++) {
                    if(outputs[outputID].content![i].format === 'sdtf') {
                        this.mergeContentNodes(currentNodes[outputID][outputs[outputID].version])
                        break;
                    }
                }
            }
        }

        this.assignMaterials(node);
        this._performanceEvaluator.endSection('outputLoading');
        return node;
    }

    // #endregion Public Methods (1)

    // #region Private Methods (2)

    private assignMaterials(node: ITreeNode) {
        const addMaterialToGeometry = (node: ITreeNode, material: IMaterialAbstractData) => {
            for (let i = 0; i < node.data.length; i++) {
                if (node.data[i] instanceof GeometryData) {
                    const geometry = <GeometryData>node.data[i];
                    const currentMaterial = geometry.primitive.material;
                    if(currentMaterial === null || currentMaterial.materialOutput === true) {
                        geometry.primitive.material = material;
                    }
                }
            }

            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                if (child) addMaterialToGeometry(child, material);
            }
        };

        const getMaterialData = (node: ITreeNode, materials: IMaterialAbstractData[] = []): IMaterialAbstractData[] => {
            for (let k = 0; k < node.data.length; k++) {
                if (node.data[k] instanceof AbstractMaterialData) {
                    const material = <IMaterialAbstractData>node.data[k];
                    material.materialOutput = true;
                    materials.push(material);
                }
            }
            
            for (let k = 0; k < node.children.length; k++) {
                const child = node.children[k];
                if(!child) continue;
                materials.push(...getMaterialData(child));
            }

            return materials;
        }

        const getGeometryData = (node: ITreeNode, geometries: GeometryData[] = []): GeometryData[] => {
            for (let k = 0; k < node.data.length; k++)
                if (node.data[k] instanceof GeometryData)
                    geometries.push(<GeometryData>node.data[k]);
            
            for (let k = 0; k < node.children.length; k++) {
                const child = node.children[k];
                if(!child) continue;
                geometries.push(...getGeometryData(child));
            }
            return geometries;
        }

        for (let m = 0; m < node.children.length; m++) {
            // per output node, we go through the material assignment process
            const outputNode = node.children[m];
            if (!outputNode) continue;

            // we go through all data properties, normally, there should ony one, but we just make sure
            for (let i = 0; i < outputNode.data.length; i++) {
                if (!(outputNode.data[i] instanceof SessionOutputData)) continue;
                
                // the session output data contains information about this Output
                // most importantly the SessionOutput property with the material and content in it
                const sessionOutputData = <SessionOutputData>outputNode.data[i];

                // case 1: we have a specific material id defined, let's use that
                if(sessionOutputData.responseOutput.material) {
                    let materialNodes: ITreeNode[] = [];
                    // now we have id
                    // get material with it    
                    for (let n = 0; n < node.children.length; n++) {
                        const materialNode = node.children[n];
                        if (!materialNode) continue;
                        if (materialNode.name === sessionOutputData.responseOutput.material)
                            materialNodes = materialNode.children;
                    }

                    const geometryNodes = outputNode.children;

                    if(materialNodes.length >= geometryNodes.length) {
                        for (let n = 0; n < geometryNodes.length; n++) {
                            addMaterialToGeometry(geometryNodes[n], getMaterialData(materialNodes[n])[0]);
                        }
                    } else {
                        if (materialNodes.length >= 1)
                            for (let n = 0; n < geometryNodes.length; n++) {
                                addMaterialToGeometry(geometryNodes[n], getMaterialData(materialNodes[0])[0]);
                            }
                    }
                } 
                // case 2: there is no specific material id defined, maybe in the content we can match geometries to ids
                else {
                    // now we hope that in our content, there are exactly the amount of geometries and material, this will be interesting :)

                    const sessionOutputContent = sessionOutputData.responseOutput.content;
                    if(sessionOutputContent === undefined) continue;

                    const materialNodes = [];
                    const geometryNodes = [];
                    for(let i = 0; i < sessionOutputContent.length; i++) {
                        if(sessionOutputContent[i].format === 'material') {
                            materialNodes.push(outputNode.children[i]);
                        } else {
                            geometryNodes.push(outputNode.children[i]);
                        }
                    }

                    if(materialNodes.length >= geometryNodes.length) {
                        for (let n = 0; n < geometryNodes.length; n++) {
                            addMaterialToGeometry(geometryNodes[n], getMaterialData(materialNodes[n])[0]);
                        }
                    } else {
                        if (materialNodes.length >= 1)
                            for (let n = 0; n < geometryNodes.length; n++) {
                                addMaterialToGeometry(geometryNodes[n], getMaterialData(materialNodes[0])[0]);
                            }
                    }
                }
            }
        }
    }

    private mergeContentNodes(node: ISessionTreeNode) {
        if(!(node.children.length > 1)) return;

        const children = [];
        while(node.children.length > 0) {
            children.push(...node.children[0].children);
            node.removeChild(node.children[0]);
        }

        const mergeNodes = (node1: ITreeNode, node2: ITreeNode) => {
            for(let i = 0; i < node1.data.length; i++)
                node2.data.push(node1.data[i]);

            for(let i = 0; i < node1.children.length; i++) {
                let childNode;
                for(let j = 0; j < node2.children.length; j++) {
                    if(node1.children[i].name === node2.children[j].name) {
                        childNode = node2.children[j];
                        break;
                    }
                }
                if(!childNode) {
                    childNode = new TreeNode(node1.children[i].name);
                    node2.addChild(childNode);
                }

                mergeNodes(node1.children[i], childNode);
            }
        }

        const newChild = new TreeNode('content_array');
        node.addChild(newChild);
        for(let i = 0; i < children.length; i++) 
            mergeNodes(children[i], newChild)
    }

    // #endregion Private Methods (2)
}