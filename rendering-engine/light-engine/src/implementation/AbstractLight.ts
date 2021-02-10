import { vec3 } from "gl-matrix";
import { ILight, LIGHTTYPE } from "../interface/ILight";
import uuid from '@shapediver/viewer.utils.uuid'
import { AbstractTreeNodeData, ITreeNodeData } from "@shapediver/viewer.node-tree.tree-node-data";

export abstract class AbstractLight extends AbstractTreeNodeData implements ILight {
    // #region Properties (1)

    private readonly _lightId: string;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        private _color: vec3,
        private _intensity: number,
        private _type: LIGHTTYPE,
        private _name?: string
    ) {
        super();
        this._lightId = uuid.create();
    }

    // #endregion Constructors (1)

    // #region Public Accessors (9)

    public get color(): vec3 {
        return this._color;
    }

    public set color(value: vec3) {
        this._color = value;
    }

    public get intensity(): number {
        return this._intensity;
    }

    public set intensity(value: number) {
        this._intensity = value;
    }

    public get lightId(): string {
        return this._lightId;
    }

    public get name(): string | undefined {
        return this._name;
    }

    public set name(value: string | undefined) {
        this._name = value;
    }

    public get type(): LIGHTTYPE {
        return this._type;
    }

    public set type(value: LIGHTTYPE) {
        this._type = value;
    }

    // #endregion Public Accessors (9)
}