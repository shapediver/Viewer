import { ICanvas } from '../interfaces/ICanvas';

export class Canvas implements ICanvas {
    // #region Constructors (1)

    constructor(private readonly _id: string, private readonly _originalDefinition?: HTMLCanvasElement | string, private readonly _canvasElement?: HTMLCanvasElement) {
        if (this._originalDefinition && this._originalDefinition instanceof HTMLCanvasElement)
            this._originalDefinition = <HTMLCanvasElement>this._originalDefinition.cloneNode(true);

        if (!_canvasElement) {
            this._canvasElement = document.createElement('canvas') as HTMLCanvasElement;
            this._canvasElement.id = this._id;
        } else {
            this._canvasElement = <HTMLCanvasElement>_canvasElement;
        }
        this._canvasElement.style.touchAction = 'none';
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get canvasElement(): HTMLCanvasElement {
        return <HTMLCanvasElement>this._canvasElement;
    }

    public get id(): string {
        return this._id;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public reset() {
        const parent = this._canvasElement?.parentElement;
        parent?.removeChild(this._canvasElement!);

        if (this._originalDefinition instanceof HTMLCanvasElement) {
            parent?.appendChild(this._canvasElement!);
        }
    }

    // #endregion Public Methods (1)
}