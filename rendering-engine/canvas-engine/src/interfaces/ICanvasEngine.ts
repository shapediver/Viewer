import { ICanvas } from './ICanvas'

export interface ICanvasEngine {
    createCanvasObject(canvasDefinition?: string | HTMLCanvasElement, storageId?: string): string;
    getCanvas(storageId: string): ICanvas;
}