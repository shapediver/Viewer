import { vec3 } from "gl-matrix";

export interface IViewerEvent {
    viewerId: string,
    cameraId?: string,
    environmentMapId?: string,
    anchorId?: string,
    lightId?: string,
    boundingBox?: { min: vec3, max: vec3}
}

export interface ISessionEvent {
    sessionId: string,
    exportId?: string,
    parameterId?: string,
    sections?: {
        session: {
            parameter: { displayname?: boolean, order?: boolean, hidden?: boolean },
            export: { displayname?: boolean, order?: boolean, hidden?: boolean }
        },
        viewer: { scene?: boolean, camera?: boolean, light?: boolean, environment?: boolean }
    }
}

export type IEvent = IViewerEvent | ISessionEvent;
