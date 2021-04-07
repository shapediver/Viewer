import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { IExport } from "./IExport";
import { IOutput } from "./IOutput";
import { IParameter } from "./IParameter";

export interface ISession {
    id: string;
    ticket: string;
    modelViewUrl: string;
    bearerToken?: string;
    initialized: boolean;

    createOutput(id: string): IOutput;
    customize(): Promise<TreeNode>;
    init(): Promise<TreeNode>;

    refreshBearerToken: () => string;

    getExport(id: string): IExport | null;
    getExportById(id: string): IExport | null;
    getExportByName(name: string): IExport[];
    getExportByType(type: string): IExport[];
    getExports(): { [key: string]: IExport; };

    getOutput(id: string): IOutput | null;
    getOutputById(id: string): IOutput | null;
    getOutputByName(name: string): IOutput[];
    getOutputs(): { [key: string]: IOutput; };
    
    getParameter(id: string): IParameter<any> | null;
    getParameterById(id: string): IParameter<any> | null;
    getParameterByName(name: string): IParameter<any>[];
    getParameterByType(type: string): IParameter<any>[];
    getParameters(): { [key: string]: IParameter<any>; };
}