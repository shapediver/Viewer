import { ITreeNodeData } from '@shapediver/viewer.node-tree.tree-node-data';
import { TreeNode } from '@shapediver/viewer.node-tree.tree-node';

import { AbstractObjectHelper } from './AbstractObjectHelper';
import { ISDObject, GeometryData, MaterialData } from '@shapediver/viewer.shared.types';

export abstract class AbstractSceneTree<T extends ISDObject> {
    // #region Properties (1)

    private _mainNode!: T;
    protected _geometryCache: {
        [key: string]: ISDObject
    } = {};

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(private _helper: AbstractObjectHelper<T>) {}

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter helper
     * @return {helper<T>}
     */
    public get helper(): AbstractObjectHelper<T> {
		return this._helper;
	}

    /**
     * Setter helper
     * @param {AbstractObjectHelper<T>} value
     */
    public set helper(value: AbstractObjectHelper<T>) {
		this._helper = value;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    /**
     * Update the scene tree with this root node.
     * 
     * @param root the root node
     */
    public updateSceneTree(root: TreeNode): void {
        this._geometryCache = {};
        if(!this._mainNode) {
            this._mainNode = this._helper.create(root.id, root.version);
            this._helper.addToScene(this._mainNode);
        }
        this.updateNode(root, this._mainNode);
    }

    // #endregion Public Methods (1)

    // #region Public Abstract Methods (2)

    /**
     * Create a geometry object with the provided geometry data.
     * 
     * @param geometry the geometry data
     * @returns the geometry object
     */
    public abstract createGeometryObject(geometry: GeometryData, parent: ISDObject): any;
    
    /**
     * Create a material object with the provided material data.
     * 
     * @param material the material data
     * @returns the material object
     */
    public abstract createMaterial(material: MaterialData): any;

    /**
     * Convert the data of the scene graph node into the format of the implementation.
     * 
     * @param data the data element
     * @param obj the corresponding type node
     */
    public abstract convertData(data: ITreeNodeData, obj: T): void;

    // #endregion Public Abstract Methods (2)

    // #region Private Methods (2)


    /**
     * Update the current node via the scene graph node.
     * Convert the data if needed.
     * 
     * @param node the scene graph node
     * @param obj the current type object
     */
    private updateNode(node: TreeNode, obj: T) {
        obj.applyTransformation(node.nodeMatrix);

        for(let i = 0, len = node.data.length; i < len; i++) {
            this.convertData(node.data[i], obj);
        }

        const nodeIds: string[] = []
        for(let i = 0; i < node.getNumberOfChildren(); i++) {
            nodeIds.push(node.getChildAt(i).id)
        }
        const dataIds = node.data.map(d => d.id);
        const dataVersions = node.data.map(d => d.version);
        const childrenToRemove = this._helper.getChildren(obj).filter(oc => (!nodeIds.includes((<T>oc).SDid)) && !(dataIds.includes((<T>oc).SDid) && dataVersions.includes((<T>oc).SDversion)));
        
        // remove children that are not anymore in there
        for(const objChild of childrenToRemove)
             this._helper.remove(objChild, obj);

        // add new children and update the ones that have a different version
        for(let i = 0, len = node.getNumberOfChildren(); i < len; i++) {
            const nodeChild = node.getChildAt(i);
            const objChild = this._helper.getChildren(obj).find(oc => (<T>oc).SDid === nodeChild.id);

            if(!objChild) {
                const newChild = this._helper.create(nodeChild.id, nodeChild.version);
                this._helper.add(newChild, obj);
                this.updateNode(nodeChild, newChild);
            } else if(objChild.SDversion !== nodeChild.version){
                this.updateNode(nodeChild, objChild);
            }
        }
    }

    // #endregion Private Methods (2)
}