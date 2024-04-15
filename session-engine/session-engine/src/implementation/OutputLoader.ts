import {
    AbstractMaterialData,
    GeometryData,
    IMaterialAbstractData,
    ITaskEvent,
    TASK_TYPE
} from '@shapediver/viewer.shared.types';
import {
    EventEngine,
    EVENTTYPE,
    IEvent,
    PerformanceEvaluator
} from '@shapediver/viewer.shared.services';
import { ISessionEngine } from '../interfaces/ISessionEngine';
import { ISessionTreeNode } from '../interfaces/ISessionTreeNode';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { OutputDelayException } from './OutputDelayException';
import { SessionOutputData } from './SessionOutputData';
import { SessionTreeNode } from './SessionTreeNode';
import { ShapeDiverResponseOutput, ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2';

// #region Type aliases (1)

export type OutputLoaderTaskEventInfo = {
    eventId: string,
    type: TASK_TYPE,
    progressRange: {
        min: number,
        max: number
    },
    data: unknown
}

// #endregion Type aliases (1)

// #region Classes (1)

export class OutputLoader {
    // #region Properties (5)

    private readonly _dataEngine?: { loadContent: (content: ShapeDiverResponseOutputContent, jwtToken?: string, taskEventId?: string) => Promise<ITreeNode> };
    private readonly _eventEngine: EventEngine = EventEngine.instance;
    private readonly _lastOutputNodes: {
        [key: string]: {
            [key: string]: ISessionTreeNode
        };
    } = {};
    private readonly _loadedOutputNodes: {
        [key: string]: {
            [key: string]: ISessionTreeNode
        };
    } = {};
    private readonly _performanceEvaluator: PerformanceEvaluator = PerformanceEvaluator.instance;

    // #endregion Properties (5)

    // #region Constructors (1)

    /**
     * The output loader takes care of loading the outputs of a session, storing them and returning stored or newly loaded nodes.
     * 
     * @param _session the session for this output loader
     */
    constructor(private readonly _sessionEngine: ISessionEngine) {
        try {
            // Attempt to load the package
            require.resolve('@shapediver/viewer.data-engine.data-engine');

            // If the package is installed, set the exported properties
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            this._dataEngine = require('@shapediver/viewer.data-engine.data-engine').DataEngine.instance;
        } catch (error) {
            // data engine not available
        }
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public getCurrentOutputVersions(): { [key: string]: string } {
        const versions: { [key: string]: string } = {};
        for (const o in this._lastOutputNodes)
            versions[o] = Object.keys(this._lastOutputNodes[o])[0];

        return versions;
    }

    /**
     * Load the outputs and return the scene graph node of the result.
     * In case the outputs have a delay property, it throws an OutputDelayException.
     * 
     * @param outputs the outputs to load
     * @returns promise with a scene graph node
     */
    public async loadOutputs(nodeName: string, outputs: { [key: string]: ShapeDiverResponseOutput; }, outputsFreeze: { [key: string]: boolean; }, taskEventInfo: OutputLoaderTaskEventInfo, throwDelay = true): Promise<SessionTreeNode> {
        this._performanceEvaluator.startSection('outputLoading');
        const node = new SessionTreeNode(nodeName);
        const currentNodes: {
            [key: string]: {
                [key: string]: ISessionTreeNode
            };
        } = {};
        const outputInfo: {
            [key: string]: {
                version: string,
                contentFormat: string[],
            }
        } = {};
        const promises: Promise<ITreeNode>[] = [];
        const promisesNodes: ISessionTreeNode[] = [];
        let maxDelay = 0;

        const progress: {
            [key: string]: number
        } = {};

        const outputIDs = Object.keys(outputs);

        const cb = (e: IEvent) => {
            const taskEvent = e as ITaskEvent;
            if (outputIDs.find(oId => taskEvent.id.startsWith(oId))) {
                progress[taskEvent.id] = taskEvent.progress;

                let sum = 0;
                Object.values(progress).forEach(p => { sum += p; });

                const outputLoadingProgress = (taskEventInfo.progressRange.max - taskEventInfo.progressRange.min) * (sum / outputIDs.length) + taskEventInfo.progressRange.min;
                const eventProgressUpdate: ITaskEvent = { type: taskEventInfo.type, id: taskEventInfo.eventId, progress: outputLoadingProgress, data: taskEventInfo.data, status: 'Output content loading progress.' };
                this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventProgressUpdate);
            }
        };

        const listenerTokens = [];
        listenerTokens.push(this._eventEngine.addListener(EVENTTYPE.TASK.TASK_START, cb));
        listenerTokens.push(this._eventEngine.addListener(EVENTTYPE.TASK.TASK_PROCESS, cb));
        listenerTokens.push(this._eventEngine.addListener(EVENTTYPE.TASK.TASK_CANCEL, cb));
        listenerTokens.push(this._eventEngine.addListener(EVENTTYPE.TASK.TASK_END, cb));

        for (const outputID in outputs) {
            // we store some necessary information as this data may have been changed after the await (see warning below)
            outputInfo[outputID] = {
                version: outputs[outputID].version,
                contentFormat: outputs[outputID].content ? outputs[outputID].content!.map(c => c.format) : []
            };

            currentNodes[outputID] = {};
            if (!this._loadedOutputNodes[outputID])
                this._loadedOutputNodes[outputID] = {};

            if (outputsFreeze[outputID]) {
                currentNodes[outputID][outputInfo[outputID].version] = this._lastOutputNodes[outputID][outputInfo[outputID].version];
                // no loading necessary, progress done
                progress[outputID] = 1;
            } else if (outputs[outputID].delay) {
                maxDelay = Math.max(maxDelay, outputs[outputID].delay!);
            } else if (!this._loadedOutputNodes[outputID][outputInfo[outputID].version]) {
                currentNodes[outputID][outputInfo[outputID].version] = new SessionTreeNode(outputID);
                currentNodes[outputID][outputInfo[outputID].version].data.push(new SessionOutputData(outputs[outputID]));
                if (outputs[outputID].content) {
                    for (let i = 0, len = outputs[outputID].content!.length; i < len; i++) {
                        if (this._dataEngine)
                            promises.push(this._dataEngine.loadContent(outputs[outputID].content![i], this._sessionEngine.jwtToken, outputID + '_' + outputInfo[outputID].version + '_' + i));
                        promisesNodes.push(currentNodes[outputID][outputInfo[outputID].version]);
                    }
                }
            } else {
                currentNodes[outputID][outputInfo[outputID].version] = this._loadedOutputNodes[outputID][outputInfo[outputID].version];
                // no loading necessary, progress done
                progress[outputID] = 1;
            }
        }

        if (maxDelay && throwDelay)
            throw new OutputDelayException(maxDelay);

        /**
         * WARNING: After this point outputs object cannot be used anymore.
         * This can happen when fast consecutive scene updates are done.
         * Therefore, we stored the data in the outputInfo.
         */

        await Promise.all(promises);

        listenerTokens.forEach(t => this._eventEngine.removeListener(t));

        // all promises are resolved, await in the next lines is just for structural purposes
        for (let i = 0; i < promises.length; i++)
            promisesNodes[i].addChild(await promises[i]);

        // here we assign all outputs just to the node and return it
        for (const outputID in outputInfo)
            if (currentNodes[outputID][outputInfo[outputID].version])
                node.addChild(currentNodes[outputID][outputInfo[outputID].version]);

        // save the nodes as the last available version
        for (const outputID in outputInfo) {
            if (!currentNodes[outputID][outputInfo[outputID].version]) continue;
            this._loadedOutputNodes[outputID] = {};
            this._loadedOutputNodes[outputID][outputInfo[outputID].version] = currentNodes[outputID][outputInfo[outputID].version];
            this._lastOutputNodes[outputID] = {};
            this._lastOutputNodes[outputID][outputInfo[outputID].version] = currentNodes[outputID][outputInfo[outputID].version];
        }

        for (const outputID in outputInfo) {
            if (!currentNodes[outputID][outputInfo[outputID].version]) continue;
            if (currentNodes[outputID][outputInfo[outputID].version].children.length > 1) {
                for (let i = 0, len = outputInfo[outputID].contentFormat!.length; i < len; i++) {
                    if (outputInfo[outputID].contentFormat[i] === 'sdtf') {
                        this.mergeContentNodes(currentNodes[outputID][outputInfo[outputID].version]);
                        break;
                    }
                }
            }
        }

        this.assignMaterials(node);
        this._performanceEvaluator.endSection('outputLoading');
        return node;
    }

    // #endregion Public Methods (2)

    // #region Private Methods (2)

    private assignMaterials(node: ITreeNode) {
        const addMaterialToGeometry = (node: ITreeNode, material: IMaterialAbstractData) => {
            for (let i = 0; i < node.data.length; i++) {
                if (node.data[i] instanceof GeometryData) {
                    const geometry = <GeometryData>node.data[i];
                    const currentMaterial = geometry.material;
                    if (currentMaterial === null || currentMaterial.materialOutput === true) {
                        geometry.material = material;
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
                if (!child) continue;
                materials.push(...getMaterialData(child));
            }

            return materials;
        };

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
                if (sessionOutputData.responseOutput.material) {
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

                    if (materialNodes.length >= geometryNodes.length) {
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
                    if (sessionOutputContent === undefined) continue;

                    const materialNodes = [];
                    const geometryNodes = [];
                    for (let i = 0; i < sessionOutputContent.length; i++) {
                        if (sessionOutputContent[i].format === 'material') {
                            if (outputNode.children[i]) materialNodes.push(outputNode.children[i]);
                        } else {
                            if (outputNode.children[i]) geometryNodes.push(outputNode.children[i]);
                        }
                    }

                    if (materialNodes.length >= geometryNodes.length) {
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
        if (!(node.children.length > 1)) return;

        const children = [];
        while (node.children.length > 0) {
            children.push(...node.children[0].children);
            node.removeChild(node.children[0]);
        }

        const mergeNodes = (node1: ITreeNode, node2: ITreeNode) => {
            for (let i = 0; i < node1.data.length; i++)
                node2.data.push(node1.data[i]);

            for (let i = 0; i < node1.children.length; i++) {
                let childNode;
                for (let j = 0; j < node2.children.length; j++) {
                    if (node1.children[i].name === node2.children[j].name) {
                        childNode = node2.children[j];
                        break;
                    }
                }
                if (!childNode) {
                    childNode = new TreeNode(node1.children[i].name);
                    node2.addChild(childNode);
                }

                mergeNodes(node1.children[i], childNode);
            }
        };

        const newChild = new TreeNode('content_array');
        node.addChild(newChild);
        for (let i = 0; i < children.length; i++)
            mergeNodes(children[i], newChild);
    }

    // #endregion Private Methods (2)
}

// #endregion Classes (1)
