import { container, singleton } from "tsyringe";
import { Logger } from "@shapediver/viewer.shared.monitoring"
import { TypeChecker } from "../type-check/TypeChecker";

export type Types = 'string' | 'boolean' | 'function' |
                    'HTMLCanvasElement' | 'enum' | 
                    'number' | 'factor' | 'positive' |
                    'vec3' | 'cubeMap';

@singleton()
export class InputValidator {

    private readonly _logger = container.resolve(Logger);
    private readonly _typeChecker = container.resolve(TypeChecker);

    public validate(value: any, stringLiteral: Types, defined: boolean = true, enumValues: string[] = []) {
        if (defined === false && typeof value === 'undefined') return;

        switch (stringLiteral) {
            case 'string':
                if(this._typeChecker.isTypeOf(value, 'string')) return;
                break;
            case 'boolean':
                if(this._typeChecker.isTypeOf(value, 'boolean')) return;
                break;
            case 'function':
                if(this._typeChecker.isTypeOf(value, 'function')) return;
                break;
            case 'number':
                if(this._typeChecker.isTypeOf(value, 'number')) return;
                break;
            case 'factor':
                if(this._typeChecker.isTypeOf(value, 'number') && value >= 0 && value <= 1) return;
                break;
            case 'positive':
                if(this._typeChecker.isTypeOf(value, 'number') && value >= 0) return;
                break;
            case 'HTMLCanvasElement':
                if(this._typeChecker.isHTMLCanvasElement(value)) return;
                break;
            case 'enum':
                if(this._typeChecker.isTypeOf(value, 'string') && enumValues.includes(value)) return;
                break;
            case 'vec3':
                if(Array.isArray(value) && this._typeChecker.isTypeOf(value[0], 'number') && this._typeChecker.isTypeOf(value[1], 'number') && this._typeChecker.isTypeOf(value[2], 'number')) return;
                break;
            case 'cubeMap':
                if(Array.isArray(value) && value.length === 6 && this._typeChecker.isTypeOf(value[0], 'string') && this._typeChecker.isTypeOf(value[1], 'string') && this._typeChecker.isTypeOf(value[2], 'string') && this._typeChecker.isTypeOf(value[3], 'string') && this._typeChecker.isTypeOf(value[4], 'string') && this._typeChecker.isTypeOf(value[5], 'string')) return;
                if(this._typeChecker.isTypeOf(value, 'string')) return;
                break;
            default:
                this._logger.error(`Invalid Input. The type ${stringLiteral} is not recognized.`);
                return;
        }
        this._logger.warn(`Invalid Input. The input ${value} is not of type ${stringLiteral}, but is ${typeof value} instead.`);
        throw new Error(`Invalid Input. The input ${value} is not of type ${stringLiteral}, but is ${typeof value} instead.`);
    }
}