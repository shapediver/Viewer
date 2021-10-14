import { vec3 } from "gl-matrix";
import { ISessionEvent } from "./ISessionEvent";

export interface ISettingsEvent extends ISessionEvent {
    sections?: {
        session: {
            parameter: { displayname?: boolean, order?: boolean, hidden?: boolean },
            export: { displayname?: boolean, order?: boolean, hidden?: boolean }
        },
        viewer: { scene?: boolean, camera?: boolean, light?: boolean, environment?: boolean }
    }
}