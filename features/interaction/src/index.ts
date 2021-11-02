import { IViewer } from "../../../api/api/dist"
import { DragManager } from "./implementation/DragManager";
import { HoverManager } from "./implementation/HoverManager";
import { InteractionEngine } from "./implementation/InteractionEngine"
import { SelectManager } from "./implementation/SelectManager";
import { IInteractionEngine } from "./interfaces/IInteractionEngine"
import { IInteractionManager } from "./interfaces/IInteractionManager";

export const createInteractionEngine = (viewer: IViewer): IInteractionEngine =>  {
    return new InteractionEngine(viewer);
}

export {
    IInteractionEngine, IInteractionManager, SelectManager, HoverManager, DragManager
}