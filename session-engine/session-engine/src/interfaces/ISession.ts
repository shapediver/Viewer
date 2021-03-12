import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { IExport } from "./IExport";
import { IOutput } from "./IOutput";
import { IParameter } from "./IParameter";

export interface ISession {
    id: string;

    createOutput(id: string): IOutput;
    customize(): Promise<TreeNode>;
    init(): Promise<TreeNode>;

    getExport(id: string): IExport;
    getExportById(id: string): IExport;
    getExportByName(name: string): IExport[];
    getExportByType(type: string): IExport[];
    getExports(): { [key: string]: IExport; };

    getOutput(id: string): IOutput;
    getOutputById(id: string): IOutput;
    getOutputByName(name: string): IOutput[];
    getOutputs(): { [key: string]: IOutput; };
    
    getParameter(id: string): IParameter;
    getParameterById(id: string): IParameter;
    getParameterByName(name: string): IParameter[];
    getParameterByType(type: string): IParameter[];
    getParameters(): { [key: string]: IParameter; };
}