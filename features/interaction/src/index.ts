import { IViewer } from "@shapediver/viewer"
import { AbstractInteractionManager } from "./implementation/AbstractInteractionManager";
import { CameraPlaneConstraint } from "./implementation/dragConstraints/CameraPlaneConstraint";
import { LineConstraint } from "./implementation/dragConstraints/LineConstraint";
import { PlaneConstraint } from "./implementation/dragConstraints/PlaneConstraint";
import { PointConstraint } from "./implementation/dragConstraints/PointConstraint";
import { DragManager } from "./implementation/managers/DragManager";
import { HoverManager } from "./implementation/managers/HoverManager";
import { InteractionEngine } from "./implementation/InteractionEngine"
import { SelectManager } from "./implementation/managers/SelectManager";
import { IDragConstraint } from "./interfaces/IDragConstraint";
import { IInteractionEngine } from "./interfaces/IInteractionEngine"
import { IInteractionManager } from "./interfaces/IInteractionManager";
import { InteractionData } from "./implementation/InteractionData";

export const createInteractionEngine = (viewer: IViewer): IInteractionEngine =>  {
    return new InteractionEngine(viewer);
}

export {
    IInteractionEngine, IInteractionManager, IDragConstraint, AbstractInteractionManager
}

export {
    InteractionData, SelectManager, HoverManager, DragManager
}

export {
    CameraPlaneConstraint, LineConstraint, PlaneConstraint, PointConstraint
}