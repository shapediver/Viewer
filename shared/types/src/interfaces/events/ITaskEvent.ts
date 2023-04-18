import { IEvent } from "@shapediver/viewer.shared.services";

export enum TASK_TYPE {
    AR_LOADING = 'ar_loading',
    ENVIRONMENT_MAP_LOADING = 'environment_map_loading',
    CUSTOM_CONTENT_LOADING = 'custom_content_loading',
    GLTF_CREATION = 'gltf_creation',
    GLTF_CONTENT_LOADING = 'gltf_content_loading',
    MATERIAL_CONTENT_LOADING = 'material_content_loading',
    TAG_CONTENT_LOADING = 'tag_content_loading',
    SDTF_CONTENT_LOADING = 'sdtf_content_loading',
    SESSION_CUSTOMIZATION = 'session_customization',
    SESSION_CREATION = 'session_creation',
    SESSION_OUTPUTS_UPDATE = 'session_outputs_update',
    SESSION_OUTPUTS_LOADING = 'session_outputs_loading',
    VIEWPORT_CREATION = 'viewer_creation',
    EXPORT_REQUEST = 'export_request',
}

export interface ITaskEvent extends IEvent {
    type: TASK_TYPE,
    id: string,
    progress: number,
    data?: any,
    status?: string
}