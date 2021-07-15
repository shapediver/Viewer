export interface ICanvas {
    readonly canvasElement: HTMLCanvasElement;
    readonly id: string;

    reset(): void;
}