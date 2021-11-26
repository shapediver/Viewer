import {
  ShapeDiverResponseExport,
  ShapeDiverResponseOutput,
  ShapeDiverResponseParameter,
} from '@shapediver/api.geometry-api-dto-v1'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'

export interface ISession {
    id: string;
    ticket: string;
    modelViewUrl: string;
    authorTicket?: boolean;
    bearerToken?: string;
    initialized: boolean;

    parameters: { [key: string]: ShapeDiverResponseParameter };
    exports: { [key: string]: ShapeDiverResponseExport };
    outputs: { [key: string]: ShapeDiverResponseOutput };

    customize(cancelRequest: () => boolean): Promise<TreeNode>;
    loadOutputs(parameters: { [key: string]: string }, cancelRequest: () => boolean): Promise<TreeNode>;
    init(parameterValues?: {
      [key: string]: string;
    }): Promise<void>;

    refreshBearerToken: () => string;
}