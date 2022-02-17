import { ShapeDiverRequestGltfUploadQueryConversion, ShapeDiverResponseExport, ShapeDiverResponseOutput, ShapeDiverResponseParameter } from '@shapediver/sdk.geometry-api-sdk-v2';
import { TreeNode } from '@shapediver/viewer.shared.node-tree'

export interface ISession {
    // #region Properties (9)

    bearerToken?: string;
    canUploadGLTF: boolean;
    exports: { [key: string]: ShapeDiverResponseExport };
    id: string;
    initialized: boolean;
    modelViewUrl: string;
    outputs: { [key: string]: ShapeDiverResponseOutput };
    parameters: { [key: string]: ShapeDiverResponseParameter };
    refreshBearerToken: () => Promise<string>;
    ticket: string;
    viewerSettings?: object;

    // #endregion Properties (9)

    // #region Public Methods (4)

    customize(cancelRequest: () => boolean): Promise<TreeNode>;
    init(parameterValues?: {
      [key: string]: string;
    }): Promise<void>;
    loadOutputs(cancelRequest: () => boolean): Promise<TreeNode>;
    requestExport(exportId: string, parameters: { [key: string]: string }, maxWaitTime: number): Promise<ShapeDiverResponseExport>;
    uploadFile(parameterId: string, data: File, type: string): Promise<string>;
    uploadGLTF(blob: Blob, conversion?: ShapeDiverRequestGltfUploadQueryConversion): Promise<string>;

    // #endregion Public Methods (4)
}