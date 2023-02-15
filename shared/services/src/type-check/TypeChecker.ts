export class TypeChecker {
    // #region Properties (1)

    private static _instance: TypeChecker;

    // #endregion Properties (1)

    // #region Public Static Accessors (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Accessors (1)

    // #region Public Methods (2)

    public isHTMLCanvasElement(value: any): boolean {
        return value instanceof HTMLCanvasElement;
    }

    public isTypeOf(value: any, type: string): boolean {
        return typeof value === type;
    }

    // #endregion Public Methods (2)
}