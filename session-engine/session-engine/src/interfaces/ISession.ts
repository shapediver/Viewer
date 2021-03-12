import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { Export } from "../implementation/Export";
import { Output } from "../implementation/Output";
import { Parameter } from "../implementation/Parameter";

export interface ISession {
    id: string;

    createOutput(id: string): Output;
    customize(): Promise<TreeNode>;
    init(): Promise<TreeNode>;

    getExport(id: string): Export;
    getExportById(id: string): Export;
    getExportByName(name: string): Export[];
    getExportByType(type: string): Export[];
    getExports(): { [key: string]: Export; };

    getOutput(id: string): Output;
    getOutputById(id: string): Output;
    getOutputByName(name: string): Output[];
    getOutputs(): { [key: string]: Output; };
    
    getParameter(id: string): Parameter;
    getParameterById(id: string): Parameter;
    getParameterByName(name: string): Parameter[];
    getParameterByType(type: string): Parameter[];
    getParameters(): { [key: string]: Parameter; };
}