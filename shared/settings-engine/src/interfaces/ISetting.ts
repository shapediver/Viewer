export interface ISetting<T> {
    default: T;
    value: T;
    note: string;
    isSetting: boolean;
    check: (value: T) => boolean;
}