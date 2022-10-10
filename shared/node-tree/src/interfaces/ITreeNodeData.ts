export interface ITreeNodeData<T extends ITreeNodeData<any>> {
  id: string;
  version: string;
  updateVersion(): void;
  clone(): T;
}