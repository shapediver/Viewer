import { IParameter } from './IParameter'

export interface IFileParameter extends IParameter<File | Blob | string> {
    upload(): Promise<string>;
}
