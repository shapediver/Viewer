import { singleton } from 'tsyringe'

@singleton()
export class TypeChecker {

    public isTypeOf(value: any, type: string): boolean {
        return typeof value === type;
    }

    public isHTMLCanvasElement(value: any): boolean {
        return value instanceof HTMLCanvasElement;
    }
}