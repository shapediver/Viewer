import { vec3 } from "gl-matrix";
import { ILight, LIGHT_TYPE } from "../interface/ILight";
import uuid from '@shapediver/viewer.utils.uuid'


export abstract class AbstractLight implements ILight {
    
    private readonly _id: string;

    constructor(
        private _color: vec3,
        private _intensity: number,
        private _type: LIGHT_TYPE,
        private _name?: string
    ) {
        this._id = uuid.create();
    }

    public get id(): string {
        return this._id;
    }
    
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
    
    public get type(): LIGHT_TYPE {
        return this._type;
    }

    public set type(value: LIGHT_TYPE) {
        this._type = value;
    }
    
    public get name(): string | undefined {
        return this._name;
    }

    public set name(value: string | undefined) {
        this._name = value;
    }
}