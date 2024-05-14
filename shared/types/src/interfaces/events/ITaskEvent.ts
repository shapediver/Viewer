import { IEvent } from '@shapediver/viewer.shared.services';

// #region Interfaces (1)

/**
 * Definition of the task event.
 * These events are sent for task specific events ({@link EVENTTYPE_TASK}).
 */
export interface ITaskEvent extends IEvent {
    // #region Properties (5)

    /**
     * The data of the task.
     */
    data?: unknown,
    /**
     * The id of the task.
     */
    id: string,
    /**
     * The progress of the task.
     */
    progress: number,
    /**
     * The status of the task.
     */
    status?: string
    /**
     * The type of the task.
     */
    type: TASK_TYPE,

    // #endregion Properties (5)
}

// #endregion Interfaces (1)

// #region Enums (1)

/**
 * Definition of the task types.
 * These types are used to identify the type of a task in a task event {@link ITaskEvent}.
 */
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

// #endregion Enums (1)
