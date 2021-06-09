import { ShapeDiverResponseExport, ShapeDiverResponseOutput, ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v1";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";

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

    createOutput(id: string): ShapeDiverResponseOutput;
    customize(): Promise<TreeNode>;
    init(): Promise<TreeNode>;

    refreshBearerToken: () => string;
}