import { vec3 } from "gl-matrix";
import { ILight, LIGHTTYPE } from "../interface/ILight";
import { UuidGenerator } from '@shapediver/viewer.shared.utils';
import { AbstractTreeNodeData, ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { ISDObject } from "@shapediver/viewer.shared.types";
import { container } from "tsyringe";

export abstract class AbstractLight extends AbstractTreeNodeData implements ILight {
    // #region Properties (6)

    private readonly _type: LIGHTTYPE;

    private _color: string;
    private _convertedObjects: ISDObject[] = [];
    private _intensity: number;
    private _name?: string;

    protected readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(properties: {
        color: string,
        intensity: number,
        type: LIGHTTYPE,
        name?: string,
    }) {
        super();
        this._color = properties.color;
        this._intensity = properties.intensity;
        this._type = properties.type;
        this._name = properties.name;
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

    /**
     * Getter convertedObjects
     * @return {ISDObject[]}
     */
    public get convertedObjects(): ISDObject[] {
        return this._convertedObjects;
    }

    /**
     * Setter convertedObjects
     * @param {ISDObject[]} value
     */
    public set convertedObjects(value: ISDObject[]) {
        this._convertedObjects = value;
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

    public get type(): LIGHTTYPE {
        return this._type;
    }

    // #endregion Public Accessors (9)
}