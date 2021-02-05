export interface ISetting<T> {
    default: T;
    value: T;
    note: string;
    check: (value: T) => boolean;
}