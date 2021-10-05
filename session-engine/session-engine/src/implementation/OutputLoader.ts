import { container } from 'tsyringe'
import { AnimationData, AnimationTrack, GeometryData, MaterialData, SDTFItemData } from '@shapediver/viewer.shared.types'
import { DataEngine } from '@shapediver/viewer.data-engine.data-engine'
import { Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import {
  ShapeDiverResponseBase as ShapeDiverResponse,
  ShapeDiverResponseOutput,
  ShapeDiverResponseOutputPart,
} from '@shapediver/api.geometry-api-dto-v1'

import { OutputDelayException } from './OutputDelayException'
import { SessionTreeNode } from './SessionTreeNode'
import { SessionOutputData } from './SessionOutputData'
import { PerformanceEvaluator } from '@shapediver/viewer.shared.services'

export class OutputLoader {
    // #region Properties (2)

    private readonly _dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);
    private readonly _performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
    private readonly _lastOutputNodes: { 
        [key: string]: {
            [key: string]: SessionTreeNode
        }; 
    } = {};
    private _animationTracks: {
        node: TreeNode,
        value: {
            times: number[],
            values: number[],
            path: 'translation' | 'scale' | 'rotation'
            interpolation: 'linear' | 'step',
            animationName: string
        }
    }[] = [];
    private _animations: {
        name: string,
        repeat: boolean
    }[] = [];

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
        this._performanceEvaluator.startSection('outputLoading');
        const node = new SessionTreeNode(session.name);
        let currentNodes: { 
            [key: string]: {
                [key: string]: SessionTreeNode
            }; 
        } = {};
        let promises: Promise<TreeNode>[] = [];
        let promisesNodes: SessionTreeNode[] = [];
        let maxDelay = 0;

        for (let outputID in outputs) {
            currentNodes[outputID] = {};
            if(!this._lastOutputNodes[outputID]) 
                this._lastOutputNodes[outputID] = {};
                
            if(outputs[outputID].delay) {
                maxDelay = Math.max(maxDelay, outputs[outputID].delay!);
            } else if(!this._lastOutputNodes[outputID][outputs[outputID].version]) {
                currentNodes[outputID][outputs[outputID].version] = new SessionTreeNode(outputID);
                currentNodes[outputID][outputs[outputID].version].data.push(new SessionOutputData(outputs[outputID]));
                if(outputs[outputID].content) {
                    for (let i = 0, len = outputs[outputID].content!.length; i < len; i++) {
                        promises.push(this._dataEngine.loadContent(outputs[outputID].content![i]))
                        promisesNodes.push(currentNodes[outputID][outputs[outputID].version])
                    }
                }
            } else {
                currentNodes[outputID][outputs[outputID].version] = this._lastOutputNodes[outputID][outputs[outputID].version];
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
            this._lastOutputNodes[outputID] = {};
            this._lastOutputNodes[outputID][outputs[outputID].version] = currentNodes[outputID][outputs[outputID].version];
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

        this._animationTracks = [];
        this.gatherAnimationData(node);
        this.processAnimationData(node);
        this.assignMaterials(node);
        this._performanceEvaluator.endSection('outputLoading');
        return node;
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    private processAnimationData(node: TreeNode) {
        while(this._animationTracks.length > 1) {
            const firstTrack = this._animationTracks[0];
            const otherTracks = this._animationTracks.filter(a => a.value.animationName === firstTrack?.value.animationName);

            let min = Infinity;
            let max = -Infinity;
            const animationTracks: AnimationTrack[] = [];
            for(let i = 0; i < otherTracks.length; i++) {
                min = Math.min(min, ...otherTracks[i].value.times);
                max = Math.max(max, ...otherTracks[i].value.times);
                animationTracks.push({
                    node: otherTracks[i].node,
                    times: otherTracks[i].value.times,
                    values: otherTracks[i].value.values,
                    path: otherTracks[i].value.path,
                    interpolation: otherTracks[i].value.interpolation
                });
            }

            const animationData = new AnimationData(firstTrack.value.animationName, animationTracks, min, max-min);
            const anim = this._animations.find(a => a.name = firstTrack.value.animationName);
            if(anim) 
                animationData.repeat = anim.repeat;
            node.data.push(animationData);
            
            this._animationTracks = this._animationTracks.filter(el => {
                return !otherTracks.includes(el);
            });
        }
    }

    private gatherAnimationData(node: TreeNode) {
        for(let i = 0; i < node.data.length; i++) {
            if(node.data[i] instanceof SDTFItemData) {
                const itemData: SDTFItemData = <SDTFItemData>node.data[i]; 
                if(itemData.attributes['SD_AnimationTrack']) {
                    console.log(itemData.attributes['SD_AnimationTrack'].value)
                    try {
                        this._animationTracks.push({
                            node,
                            value: JSON.parse(itemData.attributes['SD_AnimationTrack'].value)
                        });
                    } catch(e) {
                        console.log(e)
                    }
                }
                if(itemData.attributes['SD_Animation']) {
                    try {
                        this._animations.push(JSON.parse(itemData.attributes['SD_Animation'].value));
                    } catch(e) {
                        console.log(e)
                    }
                }
            }
        }

        for(let i = 0; i < node.children.length; i++)
            this.gatherAnimationData(node.children[i])
    }

    private mergeContentNodes(node: SessionTreeNode) {
        if(!(node.children.length > 1)) return;

        const children = [];
        while(node.children.length > 0) {
            children.push(node.children[0]);
            node.removeChild(node.children[0]);
        }

        const mergeNodes = (node1: TreeNode, node2: TreeNode) => {
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

    // #endregion Private Methods (1)
}