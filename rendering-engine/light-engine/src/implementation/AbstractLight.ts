import { vec3 } from 'gl-matrix'
import { UuidGenerator } from '@shapediver/viewer.shared.services'
import { AbstractTreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { container } from 'tsyringe'

import { ILight, LIGHT_TYPE } from '../interface/ILight'

export abstract class AbstractLight extends AbstractTreeNodeData implements ILight {
    // #region Properties (6)

    readonly #type: LIGHT_TYPE;

    #color: string;
    #intensity: number;
    #name?: string;
    #order?: number;
    #useNodeData: boolean = false;

    protected readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(properties: {
        color: string,
        intensity: number,
        type: LIGHT_TYPE,
        name?: string,
        order?: number,
        id?: string
    }) {
        super(properties.id);
        this.#color = properties.color;
        this.#intensity = properties.intensity;
        this.#type = properties.type;
        this.#name = properties.name;
        this.#order = properties.order;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (9)

    public get color(): string {
        return this.#color;
    }

    public set color(value: string) {
        this.#color = value;
        this.updateVersion();
    }

    public get intensity(): number {
        return this.#intensity;
    }

    public set intensity(value: number) {
        this.#intensity = value;
        this.updateVersion();
    }

    public get name(): string | undefined {
        return this.#name;
    }

    public set name(value: string | undefined) {
        this.#name = value;
        this.updateVersion();
    }

    public get order(): number | undefined {
        return this.#order;
    }

    public set order(value: number | undefined) {
        this.#order = value;
        this.updateVersion();
    }

    public get type(): LIGHT_TYPE {
        return this.#type;
    }

    public set useNodeData(value: boolean) {
        this.#useNodeData = value;
    }

    public get useNodeData(): boolean {
        return this.#useNodeData;
    }

    // #endregion Public Accessors (9)
}