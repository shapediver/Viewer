export interface ITreeNodeData {
  id: string;
  version: string;
  updateVersion(): void;
  clone(): ITreeNodeData;
}