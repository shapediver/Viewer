import { vec3 } from 'gl-matrix'
import { UuidGenerator } from '@shapediver/viewer.shared.services'
import { AbstractTreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { container } from 'tsyringe'

import { ILight, LIGHTTYPE } from '../interface/ILight'

export abstract class AbstractLight extends AbstractTreeNodeData implements ILight {
    // #region Properties (6)

    private readonly _type: LIGHTTYPE;

    private _color: string;
    private _intensity: number;
    private _name?: string;
    private _order?: number;
    private _useNodeData: boolean = false;

    protected readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(properties: {
        color: string,
        intensity: number,
        type: LIGHTTYPE,
        name?: string,
        order?: number,
        id?: string
    }) {
        super(properties.id);
        this._color = properties.color;
        this._intensity = properties.intensity;
        this._type = properties.type;
        this._name = properties.name;
        this._order = properties.order;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (9)

    public get color(): string {
        return this._color;
    }

    public set color(value: string) {
        this._color = value;
        this.updateVersion();
    }

    public get intensity(): number {
        return this._intensity;
    }

    public set intensity(value: number) {
        this._intensity = value;
        this.updateVersion();
    }

    public get name(): string | undefined {
        return this._name;
    }

    public set name(value: string | undefined) {
        this._name = value;
        this.updateVersion();
    }

    public get order(): number | undefined {
        return this._order;
    }

    public set order(value: number | undefined) {
        this._order = value;
        this.updateVersion();
    }

    public get type(): LIGHTTYPE {
        return this._type;
    }

    public set useNodeData(value: boolean) {
        this._useNodeData = value;
    }

    public get useNodeData(): boolean {
        return this._useNodeData;
    }

    // #endregion Public Accessors (9)
}