export class Canvas {
    // #region Constructors (1)

    constructor(private readonly _id: string, private readonly _canvasElement?: HTMLCanvasElement) {
        if (!_canvasElement) {
            this._canvasElement = document.createElement("canvas") as HTMLCanvasElement;
            this._canvasElement.id = this._id;
        } else {
            this._canvasElement = <HTMLCanvasElement>_canvasElement;
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter canvasElement
     * @return {HTMLCanvasElement}
     */
    public get canvasElement(): HTMLCanvasElement {
        return <HTMLCanvasElement>this._canvasElement;
    }

    /**
     * Getter id
     * @return {string}
     */
    public get id(): string {
        return this._id;
    }

    // #endregion Public Accessors (2)
}