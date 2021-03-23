import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { IExport } from "./IExport";
import { IOutput } from "./IOutput";
import { IParameter } from "./IParameter";

export interface ISession {
    id: string;

    createOutput(id: string): IOutput;
    customize(): Promise<TreeNode>;
    init(): Promise<TreeNode>;

    getExport(id: string): IExport | null;
    getExportById(id: string): IExport | null;
    getExportByName(name: string): IExport[];
    getExportByType(type: string): IExport[];
    getExports(): { [key: string]: IExport; };

    getOutput(id: string): IOutput | null;
    getOutputById(id: string): IOutput | null;
    getOutputByName(name: string): IOutput[];
    getOutputs(): { [key: string]: IOutput; };
    
    getParameter(id: string): IParameter | null;
    getParameterById(id: string): IParameter | null;
    getParameterByName(name: string): IParameter[];
    getParameterByType(type: string): IParameter[];
    getParameters(): { [key: string]: IParameter; };
}