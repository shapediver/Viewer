import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree';

export class CustomData extends AbstractTreeNodeData {
    // #region Constructors (1)

    /**
     * Creates a custom data node.
     * 
     * @param _data the data as key- value pairs 
     * @param id the id
     */
    constructor(
        private _data: { [key: string]: any },
        id?: string
    ) {
        super(id);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter data
     * @return {{ [key: string]: any }}
     */
    public get data(): { [key: string]: any } {
		return this._data;
	}

    /**
     * Setter data
     * @param {{ [key: string]: any }} value
     */
    public set data(value: { [key: string]: any }) {
		this._data = value;
	}

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        // https://shapediver.atlassian.net/browse/SS-2959 real deep copy + test
        return new CustomData({...this.data}, this._id);
    }

    // #endregion Public Methods (1)
}
