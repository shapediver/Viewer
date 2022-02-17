import { IEvent } from "@shapediver/viewer.shared.services";

export enum TASKTYPE {
    AR_LOADING = 'ar_loading',
    ENVIRONMENT_MAP_LOADING = 'environment_map_loading',
    SESSION_CUSTOMIZATION = 'session_customization',
    SESSION_CREATION = 'session_creation',
    SESSION_INITIAL_OUTPUTS_LOADED = 'session_initial_outputs_loaded',
    SESSION_OUTPUTS_UPDATE = 'session_outputs_update',
    VIEWER_CREATION = 'viewer_creation',
    EXPORT_REQUEST = 'export_request',
}

export interface ITaskEvent extends IEvent {
    type: TASKTYPE,
    id: string,
    progress: number,
    data?: any,
    status?: string
}