import { ShapeDiverResponseParameter } from "@shapediver/sdk.geometry-api-sdk-v2";

export interface IParameter<T> extends ShapeDiverResponseParameter {
    // #region Properties (2)

    sessionValue: T | string;
    value: T | string;

    // #endregion Properties (2)

    // #region Public Methods (4)

    isValid(value: any, throwError?: boolean): boolean;
    resetToDefaultValue(): void;
    resetToSessionValue(): void;
    stringify(): string;

    // #endregion Public Methods (4)
}