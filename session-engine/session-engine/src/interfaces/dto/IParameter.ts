import { ShapeDiverResponseParameter } from '@shapediver/sdk.geometry-api-sdk-v2';

export interface IParameter<T> extends ShapeDiverResponseParameter {
    // #region Properties (2)

    sessionValue: T | string;
    value: T | string;

    // #endregion Properties (2)

    // #region Public Methods (4)

    isValid(value: unknown): boolean;
    resetToDefaultValue(): void;
    resetToSessionValue(): void;
    stringify(value?: unknown): string;

    // #endregion Public Methods (4)
}