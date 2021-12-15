import { ShapeDiverResponseParameter } from "@shapediver/sdk.geometry-api-sdk-v2";

export interface IParameter<T> extends ShapeDiverResponseParameter {
    lastValidatedValue: T | string;
    sessionValue: T | string;
    value: T | string;
    
    /**
     * Evaluates if a given value is valid for this parameter.
     * 
     * @param value 
     * @returns 
     */
    isValid(value: any, throwError: boolean): boolean;
    
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
     * @returns 
     */
    stringify(): string;
}