import { ShapeDiverResponseParameter } from "@shapediver/sdk.geometry-api-sdk-v2";

/**
 * The api for a parameter of the corresponding [session]{@link ISessionApi}.
 * The current value can be changed by setting the {@link value} property.
 * Additional information of the parameter is provided, as well as values at different states.
 */
export interface IParameterApi<T> extends ShapeDiverResponseParameter {
    // #region Properties (3)

    /**
     * The last value that was successfully validated.
     */
    lastValidatedValue: T | string;

    /**
     * The value that is currently used in the session.
     */
    sessionValue: T | string;

    /**
     * The current value.
     */
    value: T | string;

    // #endregion Properties (3)

    // #region Public Methods (4)

    /**
     * Evaluates if a given value is valid for this parameter.
     * 
     * @param value the value to evaluate
     * @param throwError if true, an error is thrown if the value is not valid (default: false)
     */
    isValid(value: any, throwError?: boolean): boolean;

    /**
     * Resets the value to the default value.
     */
    resetToDefaultValue(): void;

    /**
     * Resets the value to the value currently used in the computed session.
     */
    resetToSessionValue(): void;
    
    /**
     * Returns the current value as a string
     */
    stringify(): string;

    // #endregion Public Methods (4)
}