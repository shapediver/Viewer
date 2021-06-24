import { container, singleton } from "tsyringe";
import { Logger, LOGGINGTOPIC } from "@shapediver/viewer.shared.monitoring"
import { TypeChecker } from "../type-check/TypeChecker";

export type Types = 'string' | 'boolean' | 'function' |
                    'HTMLCanvasElement' | 'enum' | 
                    'number' | 'factor' | 'positive' |
                    'vec3' | 'cubeMap' | 'stringArray' | 'object' | 'file' | 'color';

@singleton()
export class InputValidator {

    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _typeChecker: TypeChecker = <TypeChecker>container.resolve(TypeChecker);

    public validateAndError(topic: LOGGINGTOPIC, scope: string, value: any, type: Types, defined: boolean = true, enumValues: string[] = []) {
        const res = this.validate(value, type, defined, enumValues);
        if(res) return;
        this._logger.error(topic, `${scope}: Input could not be validated. ${value} is not of type ${type}.${defined === false ? ' (Can also be undefined)' : ''}`, new Error());
    }

    private validate(value: any, stringLiteral: Types, defined: boolean = true, enumValues: string[] = []): boolean {
        if (defined === false && typeof value === 'undefined') return true;

        switch (stringLiteral) {
            case 'string':
                if(this._typeChecker.isTypeOf(value, 'string')) return true;
                break;
            case 'boolean':
                if(this._typeChecker.isTypeOf(value, 'boolean')) return true;
                break;
            case 'function':
                if(this._typeChecker.isTypeOf(value, 'function')) return true;
                break;
            case 'number':
                if(this._typeChecker.isTypeOf(value, 'number')) return true;
                break;
            case 'factor':
                if(this._typeChecker.isTypeOf(value, 'number') && value >= 0 && value <= 1) return true;
                break;
            case 'positive':
                if(this._typeChecker.isTypeOf(value, 'number') && value >= 0) return true;
                break;
            case 'HTMLCanvasElement':
                if(this._typeChecker.isHTMLCanvasElement(value)) return true;
                break;
            case 'enum':
                if(this._typeChecker.isTypeOf(value, 'string') && enumValues.includes(value)) return true;
                break;
            case 'vec3':
                if (value.constructor === Float32Array)
                    value = Array.from(value);
                if(Array.isArray(value) && this._typeChecker.isTypeOf(value[0], 'number') && this._typeChecker.isTypeOf(value[1], 'number') && this._typeChecker.isTypeOf(value[2], 'number')) return true;
                break;
            case 'cubeMap':
                if(Array.isArray(value) && value.length === 6 && this._typeChecker.isTypeOf(value[0], 'string') && this._typeChecker.isTypeOf(value[1], 'string') && this._typeChecker.isTypeOf(value[2], 'string') && this._typeChecker.isTypeOf(value[3], 'string') && this._typeChecker.isTypeOf(value[4], 'string') && this._typeChecker.isTypeOf(value[5], 'string')) return true;
                if(this._typeChecker.isTypeOf(value, 'string')) return true;
                break;
            case 'stringArray':
                if(Array.isArray(value)) {
                    let check = true;
                    for(let i = 0; i < value.length; i++)
                        if(typeof value[i] !== 'string') check = false;
                    if (check === true) return true;
                }
                break;
            case 'object':
                if(this._typeChecker.isTypeOf(value, 'object')) return true;
                break;
            case 'file':
                if(this._typeChecker.isTypeOf(value, 'string') || value instanceof File || value instanceof Blob) return true;
                break;
            case 'color':
                if(this._typeChecker.isTypeOf(value, 'string') || (Array.isArray(value) && this._typeChecker.isTypeOf(value[0], 'number') && this._typeChecker.isTypeOf(value[1], 'number') && this._typeChecker.isTypeOf(value[2], 'number')) || this._typeChecker.isTypeOf(value, 'number')) return true;
                break;
            default:
                return false;
        }
        return false;
    }
}