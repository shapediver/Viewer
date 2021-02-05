/**
 * ### The API for a single Parameter
 * Here you could basically change all properties of the parameter (at least all that are possible to change).
 * Also, you could change the value of it.
 * A value change could optionally trigger the customization of the scene.
 * Per default, it wouldn't do that to allow multiple parameter changes at once.
 * By calling `customize` in the {@link Session} the changes would be executed.
 */
export interface IParameter {
    id: string;
    choices?: string[];
    decimalplaces?: string;
    defval: string;
    format?: Array<string>;
    max?: string;
    min?: string;
    name?: string;
    note?: string;
    type: string;
    visualization?: string;
    value: string;
}