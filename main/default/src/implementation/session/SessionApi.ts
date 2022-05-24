import { ShapeDiverResponseDto } from "@shapediver/api.geometry-api-dto-v2";
import { SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { container } from "tsyringe";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { ICreationControlCenter, CreationControlCenter } from "@shapediver/viewer.main.creation-control-center";
import { IExportApi } from "../../interfaces/session/IExportApi";
import { IOutputApi } from "../../interfaces/session/IOutputApi";
import { IParameterApi } from "../../interfaces/session/IParameterApi";
import { ISessionApi } from "../../interfaces/session/ISessionApi";

export class SessionApi implements ISessionApi {
    // #region Properties (15)

    readonly #sessionEngine: SessionEngine;
    readonly #creationControlCenter: ICreationControlCenter = <ICreationControlCenter>container.resolve(CreationControlCenter);

    // #endregion Properties (15)


    constructor(sessionEngine: SessionEngine) {
        this.#sessionEngine = sessionEngine;
    }
    // #region Public Accessors (30)

    public get automaticSceneUpdate(): boolean {
        throw new Error('Missing impl')
    }

    public set automaticSceneUpdate(value: boolean) {
    }

    public get commitParameters(): boolean {
        throw new Error('Missing impl')
    }

    public set commitParameters(value: boolean) {
    }

    public get commitSettings(): boolean {
        throw new Error('Missing impl')
    }

    public set commitSettings(value: boolean) {
    }

    public get customizeOnParameterChange(): boolean {
        throw new Error('Missing impl')
    }

    public set customizeOnParameterChange(value: boolean) {
    }

    public get excludeViewports(): string[] {
        throw new Error('Missing impl')
    }

    public set excludeViewports(value: string[]) {
        throw new Error('Missing impl')
    }

    public get exports(): { [key: string]: IExportApi; } {
        throw new Error('Missing impl')
    }

    public set exports(value: { [key: string]: IExportApi; }) {
    }

    public get id(): string {
        return this.#sessionEngine.id;
    }

    public get initialized(): boolean {
        return this.#sessionEngine.initialized;
    }

    public get jwtToken(): string | undefined {
        return this.#sessionEngine.bearerToken;
    }

    public set jwtToken(value: string | undefined) {
        this.#sessionEngine.bearerToken = value;
    }

    public get modelViewUrl(): string {
        return this.#sessionEngine.modelViewUrl;
    }

    public get node(): ITreeNode {
        throw new Error('Missing impl')
    }

    public set node(value: ITreeNode) {
    }

    public get outputs(): { [key: string]: IOutputApi; } {
        throw new Error('Missing impl')
    }

    public set outputs(value: { [key: string]: IOutputApi; }) {
    }

    public get parameters(): { [key: string]: IParameterApi<any>; } {
        throw new Error('Missing impl')
    }

    public set parameters(value: { [key: string]: IParameterApi<any>; }) {
    }

    public get refreshJwtToken(): (() => Promise<string>) | undefined {
        return this.#sessionEngine.refreshBearerToken;
    }

    public set refreshJwtToken(value: (() => Promise<string>) | undefined) {
        this.#sessionEngine.refreshBearerToken = value;
    }

    public get ticket(): string {
        return this.#sessionEngine.ticket;
    }

    // #endregion Public Accessors (30)

    // #region Public Methods (21)

    public applySettings(response: ShapeDiverResponseDto, sections?: { session?: { parameter?: { displayname?: boolean | undefined; order?: boolean | undefined; hidden?: boolean | undefined; value?: boolean | undefined; } | undefined; export?: { displayname?: boolean | undefined; order?: boolean | undefined; hidden?: boolean | undefined; } | undefined; } | undefined; viewport?: { scene?: boolean | undefined; camera?: boolean | undefined; light?: boolean | undefined; environment?: boolean | undefined; } | undefined; }): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public canGoBack(): boolean {
        throw new Error("Method not implemented.");
    }

    public canGoForward(): boolean {
        throw new Error("Method not implemented.");
    }

    public async close(): Promise<void> {
        await this.#creationControlCenter.closeSessionEngine(this.id);
    }

    public customize(): Promise<ITreeNode> {
        throw new Error("Method not implemented.");
    }

    public getExportById(id: string): IExportApi | null {
        throw new Error("Method not implemented.");
    }

    public getExportByName(name: string): IExportApi[] {
        throw new Error("Method not implemented.");
    }

    public getExportByType(type: string): IExportApi[] {
        throw new Error("Method not implemented.");
    }

    public getOutputByFormat(format: string): IOutputApi[] {
        throw new Error("Method not implemented.");
    }

    public getOutputById(id: string): IOutputApi | null {
        throw new Error("Method not implemented.");
    }

    public getOutputByName(name: string): IOutputApi[] {
        throw new Error("Method not implemented.");
    }

    public getParameterById(id: string): IParameterApi<any> | null {
        throw new Error("Method not implemented.");
    }

    public getParameterByName(name: string): IParameterApi<any>[] {
        throw new Error("Method not implemented.");
    }

    public getParameterByType(type: string): IParameterApi<any>[] {
        throw new Error("Method not implemented.");
    }

    public goBack(): Promise<ITreeNode> {
        throw new Error("Method not implemented.");
    }

    public goForward(): Promise<ITreeNode> {
        throw new Error("Method not implemented.");
    }

    public saveDefaultParameters(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    public saveSessionProperties(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    public saveSettings(viewportId?: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    public updateOutputs(): Promise<ITreeNode> {
        throw new Error("Method not implemented.");
    }

    // #endregion Public Methods (21)
}