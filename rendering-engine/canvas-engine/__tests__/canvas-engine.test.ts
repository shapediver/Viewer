import "reflect-metadata"
import { container } from "tsyringe";
import { CanvasEngine } from "../src/CanvasEngine";
import { Canvas } from "../src/Canvas";

describe('canvas engine test', () => {
    let instance: CanvasEngine;

    beforeEach(() => {
        container.clearInstances();
        instance = <CanvasEngine>container.resolve(CanvasEngine);
    });

    it('create without input', async () => {
        const canvas = instance.createCanvasObject();
        expect(canvas).toBeInstanceOf(Canvas);
        expect(canvas.canvasElement).toBeInstanceOf(HTMLCanvasElement);
    });

    it('create with already defined canvas without id', async () => {
        const canvasElement = document.createElement("canvas") as HTMLCanvasElement;
        const canvas = instance.createCanvasObject(canvasElement);
        expect(canvas).toBeInstanceOf(Canvas);
        expect(canvas.canvasElement).toBe(canvasElement);
    });

    it('create with already defined canvas with id', async () => {
        const canvasElement = document.createElement("canvas") as HTMLCanvasElement;
        canvasElement.id = 'test';
        const canvas = instance.createCanvasObject(canvasElement);
        expect(canvas).toBeInstanceOf(Canvas);
        expect(canvas.canvasElement).toBe(canvasElement);
        expect(canvas.canvasElement.id).toBe(canvasElement.id);
    });

    it('create with id', async () => {
        const id = "test";
        const canvas = instance.createCanvasObject(id);
        expect(canvas).toBeInstanceOf(Canvas);
        expect(canvas.canvasElement.id).toBe(id);
    });

    it('create with id of HTMLCanvasElement', async () => {
        const id = "test";
        const canvasElement = document.createElement("canvas") as HTMLCanvasElement;
        canvasElement.id = id;
        document.body.appendChild(canvasElement);
        const canvas = instance.createCanvasObject(id);
        expect(canvas).toBeInstanceOf(Canvas);
        expect(canvas.canvasElement).toBe(canvasElement);
        expect(canvas.canvasElement.id).toBe(id);
    });

    it('create with already created id', async () => {
        const id = "test";
        const canvas1 = instance.createCanvasObject(id);
        const canvas2 = instance.createCanvasObject(id);
        expect(canvas1).toBeInstanceOf(Canvas);
        expect(canvas2).toBeInstanceOf(Canvas);
        expect(canvas1).toBe(canvas2);
    });
})