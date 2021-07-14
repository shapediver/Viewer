import { container } from 'tsyringe';

import { MaterialData, GeometryData } from '@shapediver/viewer.shared.types';
import { DataEngine } from '@shapediver/viewer.data-engine.data-engine'

import { OutputDelayException } from './OutputDelayException';
import { SessionTreeNode } from './SessionTreeNode';
import { TreeNode } from '@shapediver/viewer.shared.node-tree';
import { SessionOutputData } from './SessionOutputData';
import { ShapeDiverResponseBase as ShapeDiverResponse, ShapeDiverResponseOutput, ShapeDiverResponseOutputPart } from "@shapediver/api.geometry-api-dto-v1"

export class OutputLoader {
    // #region Properties (2)

    private readonly _dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);
    private readonly _outputNodes: { 
        [key: string]: {
            [key: string]: SessionTreeNode
        }; 
    } = {};

    // #endregion Properties (2)

    // #region Constructors (1)

    /**
     * The output loader takes care of loading the outputs of a session, storing them and returning stored or newly loaded nodes.
     * 
     * @param _session the session for this output loader
     */
    constructor() {}

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
     * Load the outputs and return the scene graph node of the result.
     * In case the outputs have a delay property, it throws an OutputDelayException.
     * 
     * @param outputs the outputs to load
     * @returns promise with a scene graph node
     */
    public async loadOutputs(session: ShapeDiverResponse, outputs?: { [key: string]: ShapeDiverResponseOutput; }): Promise<SessionTreeNode> {
        const node = new SessionTreeNode(session.name);
        let currentNodes: { 
            [key: string]: {
                [key: string]: Promise<SessionTreeNode>
            }; 
        } = {};
        let promises: Promise<SessionTreeNode>[] = [];
        let maxDelay = 0;

        for (let outputID in outputs) {
            currentNodes[outputID] = {};
            if(!this._outputNodes[outputID]) 
                this._outputNodes[outputID] = {};
                
            if(!this._outputNodes[outputID][outputs[outputID].version]) {
                if(outputs[outputID].delay) {
                    maxDelay = Math.max(maxDelay, outputs[outputID].delay!);
                } else {
                    // check for overhead https://shapediver.atlassian.net/browse/SS-2958
                    currentNodes[outputID][outputs[outputID].version] = this.loadOutput(outputID, outputs[outputID]);
                    promises.push(currentNodes[outputID][outputs[outputID].version]);
                }
            }
        }

        if(maxDelay)
            throw new OutputDelayException(maxDelay);

        await Promise.all(promises);

        // all promises are resolved, await in the next lines is just for structural purposes
        // here we assign all outputs just to the node and return it
        for (let outputID in outputs) {
            if(!this._outputNodes[outputID][outputs[outputID].version])
                this._outputNodes[outputID][outputs[outputID].version] = await currentNodes[outputID][outputs[outputID].version];
            node.addChild(this._outputNodes[outputID][outputs[outputID].version]);
        }

        for (let outputID in outputs) {
            for(let outputVersion in this._outputNodes[outputID]) {
                if(outputVersion !== outputs[outputID].version)
                    delete this._outputNodes[outputID][outputVersion];
            }
        }

        this.assignMaterials(node);
        return node;
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    private assignMaterials(node: TreeNode) {
        const addMaterialToGeometry = (node: TreeNode, material: MaterialData) => {
            for (let i = 0; i < node.data.length; i++)
                if (node.data[i] instanceof GeometryData) 
                    (<GeometryData>node.data[i]).primitive.material = material;
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                if (child) addMaterialToGeometry(child, material);
            }
        };

        const getMaterialData = (node: TreeNode, materials: MaterialData[] = []): MaterialData[] => {
            for (let k = 0; k < node.data.length; k++)
                if (node.data[k] instanceof MaterialData)
                    materials.push(<MaterialData>node.data[k]);
            
            for (let k = 0; k < node.children.length; k++) {
                const child = node.children[k];
                if(!child) continue;
                materials.push(...getMaterialData(child));
            }

            return materials;
        }

        const getGeometryData = (node: TreeNode, geometries: GeometryData[] = []): GeometryData[] => {
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
                if(sessionOutputData.sessionOutput.material) {

                    let materials: MaterialData[] = [];
                    // now we have id
                    // get material with it    
                    for (let n = 0; n < node.children.length; n++) {
                        const materialNode = node.children[n];
                        if (!materialNode) continue;
                        if (materialNode.name === sessionOutputData.sessionOutput.material)
                            materials = getMaterialData(materialNode);
                    }

                    const geometries = getGeometryData(outputNode);

                    if(materials.length === geometries.length) {
                        for (let n = 0; n < geometries.length; n++)
                            geometries[n].primitive.material = materials[n];
                    } else {
                        if (materials.length >= 1)
                            for (let n = 0; n < geometries.length; n++)
                                geometries[n].primitive.material = materials[0];
                    }
                } 
                // case 2: there is no specific material id defined, maybe in the content we can match geometries to ids
                else {
                    // now we hope that in our content, there are exactly the amount of geometries and material, this will be interesting :)
                    const sessionOutputContent = sessionOutputData.sessionOutput.content;
                    if(sessionOutputContent === undefined) continue;
                    const materials = getMaterialData(outputNode);
                    const geometries = getGeometryData(outputNode);
                    
                    if(materials.length === geometries.length) {
                        for (let n = 0; n < geometries.length; n++)
                            geometries[n].primitive.material = materials[n];
                    }
                }
            }

        }
    }

    /**
     * Loads a single output and returns the according scene graph node.
     * 
     * @param id the id of the output
     * @param output the output definition
     * @returns promise with a scene graph node
     */
    private async loadOutput(id: string, output: ShapeDiverResponseOutput): Promise<SessionTreeNode> {
        const outputNode = new SessionTreeNode(id);
        outputNode.data.push(new SessionOutputData(output));
        if(output.content)
            for (let i = 0, len = output.content.length; i < len; i++)
                outputNode.addChild(await this.loadContent('content_' + i, output.content[i]));
        return outputNode;
    }
    
    /**
     * Loads a single content of the content array
     * 
     * @param name the name of the content item
     * @param content the content definition
     * @returns promise with a scene graph node
     */
    public async loadContent(name: string, content: ShapeDiverResponseOutputPart): Promise<SessionTreeNode> {
        const contentNode = new SessionTreeNode(name);
        contentNode.addChild(await this._dataEngine.loadContent(content));
        return contentNode;
    }

    // #endregion Private Methods (1)
}