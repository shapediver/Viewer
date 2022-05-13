import { ICreationControlCenter } from "../interfaces/ICreationControlCenter";

export class CreationControlCenter implements ICreationControlCenter {
    closeSession(id: string, force?: boolean): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    closeViewer(id: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    createSession(properties: { ticket: string; modelViewUrl: string; bearerToken?: string | undefined; primarySession?: boolean | undefined; id?: string | undefined; excludeViewers?: string[] | undefined; waitForOutputs?: boolean | undefined; loadOutputs?: boolean | undefined; initialParameters?: { [key: string]: string; } | undefined; }): Promise<any> {
        throw new Error("Method not implemented.");
    }
    createViewer(properties?: { visibility?: any; canvas?: HTMLCanvasElement | undefined; id?: string | undefined; branding?: { logo?: string | null | undefined; backgroundColor?: string | undefined; } | undefined; }): Promise<any> {
        throw new Error("Method not implemented.");
    }
}