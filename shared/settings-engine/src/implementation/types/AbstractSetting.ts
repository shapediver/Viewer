import { ISetting } from "../../interfaces/ISetting";

export abstract class AbstractSetting {
    // #region Constructors (1)

    constructor(
        private _note: string = ""
    ) { }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
       * Getter note
       * @return {string}
       */
    public get note(): string {
        return this._note;
    }

    /**
       * Setter note
       * @param {string} value
       */
    public set note(value: string) {
        this._note = value;
    }

    // #endregion Public Accessors (2)
}