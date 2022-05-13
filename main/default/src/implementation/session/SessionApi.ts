import { ShapeDiverResponseDto } from "@shapediver/api.geometry-api-dto-v2";
import { ITreeNode } from "../../../../../shared/node-tree/dist";
import { IExportApi } from "../../interfaces/session/IExportApi";
import { IOutputApi } from "../../interfaces/session/IOutputApi";
import { IParameterApi } from "../../interfaces/session/IParameterApi";
import { ISessionApi } from "../../interfaces/session/ISessionApi";

export class SessionApi implements ISessionApi {
    exports: { [key: string]: IExportApi; } = {};
    outputs: { [key: string]: IOutputApi; } = {};
    parameters: { [key: string]: IParameterApi<any>; } = {};
    id: string = "";
    modelViewUrl: string = "";
    ticket: string = "";
    initialized: boolean = false;
    node!: ITreeNode;
    commitParameters: boolean = false;
    commitSettings: boolean = false;
    automaticSceneUpdate: boolean = false;
    customizeOnParameterChange: boolean = false;
    jwtToken: string | undefined;
    refreshJwtToken!: () => Promise<string>;
    applySettings(response: ShapeDiverResponseDto, sections?: { session?: { parameter?: { displayname?: boolean | undefined; order?: boolean | undefined; hidden?: boolean | undefined; value?: boolean | undefined; } | undefined; export?: { displayname?: boolean | undefined; order?: boolean | undefined; hidden?: boolean | undefined; } | undefined; } | undefined; viewport?: { scene?: boolean | undefined; camera?: boolean | undefined; light?: boolean | undefined; environment?: boolean | undefined; } | undefined; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    canGoBack(): boolean {
        throw new Error("Method not implemented.");
    }
    canGoForward(): boolean {
        throw new Error("Method not implemented.");
    }
    close(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    customize(): Promise<ITreeNode> {
        throw new Error("Method not implemented.");
    }
    getExportById(id: string): IExportApi | null {
        throw new Error("Method not implemented.");
    }
    getExportByName(name: string): IExportApi[] {
        throw new Error("Method not implemented.");
    }
    getExportByType(type: string): IExportApi[] {
        throw new Error("Method not implemented.");
    }
    getOutputByFormat(format: string): IOutputApi[] {
        throw new Error("Method not implemented.");
    }
    getOutputById(id: string): IOutputApi | null {
        throw new Error("Method not implemented.");
    }
    getOutputByName(name: string): IOutputApi[] {
        throw new Error("Method not implemented.");
    }
    getParameterById(id: string): IParameterApi<any> | null {
        throw new Error("Method not implemented.");
    }
    getParameterByName(name: string): IParameterApi<any>[] {
        throw new Error("Method not implemented.");
    }
    getParameterByType(type: string): IParameterApi<any>[] {
        throw new Error("Method not implemented.");
    }
    goBack(): Promise<ITreeNode> {
        throw new Error("Method not implemented.");
    }
    goForward(): Promise<ITreeNode> {
        throw new Error("Method not implemented.");
    }
    init(waitForOutputs?: boolean, loadOutputs?: boolean, initialParameters?: { [key: string]: string; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    saveDefaultParameters(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    saveSessionProperties(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    saveSettings(viewportId?: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    updateOutputs(): Promise<ITreeNode> {
        throw new Error("Method not implemented.");
    }

}