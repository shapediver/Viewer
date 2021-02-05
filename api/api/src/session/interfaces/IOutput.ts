import { SessionOutputContent } from "@shapediver/viewer.shared.types";

export interface IOutput {
    id: string;
    bbmax?: number[];
    bbmin?: number[];
    content?: SessionOutputContent[];
    delay?: number;
    material?: string;
    name?: string;
    version: string;
}