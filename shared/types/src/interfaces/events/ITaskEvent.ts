// #region Interfaces (1)

import {type IEvent} from "./IEvent";

/**
 * Definition of the task event.
 * These events are sent for task specific events ({@link EVENTTYPE_TASK}).
 */
export interface ITaskEvent extends IEvent {
	// #region Properties (5)

	/**
	 * The data of the task.
	 */
	data?: unknown;
	/**
	 * The id of the task.
	 */
	id: string;
	/**
	 * The progress of the task.
	 */
	progress: number;
	/**
	 * The status of the task.
	 */
	status?: string;
	/**
	 * The type of the task.
	 */
	type: TASK_TYPE;
	/**
	 * The category of the task (if available).
	 */
	category?: TaskCategoryTypes;

	// #endregion Properties (5)
}

/**
 * Description of a task event.
 * Used to create new task events.
 */
export interface ITaskEventDescription {
	/**
	 * The id of the task.
	 */
	id: string;
	/**
	 * The type of the task.
	 */
	type: TASK_TYPE;
	/**
	 * The category of the task (if available).
	 */
	category?: TaskCategoryTypes;
	/**
	 * The progress range of the task.
	 */
	progressRange: {
		min: number;
		max: number;
	};
	/**
	 * The data of the task.
	 */
	data?: unknown;
}

// #endregion Interfaces (1)

// #region Enums (1)

/**
 * Definition of the task types.
 * These types are used to identify the type of a task in a task event {@link ITaskEvent}.
 */
export enum TASK_TYPE {
	AR_LOADING = "ar_loading",
	ENVIRONMENT_MAP_LOADING = "environment_map_loading",
	CUSTOM_CONTENT_LOADING = "custom_content_loading",
	GLTF_CREATION = "gltf_creation",
	GLTF_CONTENT_LOADING = "gltf_content_loading",
	MATERIAL_CONTENT_LOADING = "material_content_loading",
	MATERIAL_DATABASE_LOADING = "material_database_loading",
	TAG_CONTENT_LOADING = "tag_content_loading",
	SDTF_CONTENT_LOADING = "sdtf_content_loading",
	SESSION_CUSTOMIZATION = "session_customization",
	SESSION_CREATION = "session_creation",
	SESSION_OUTPUTS_UPDATE = "session_outputs_update",
	SESSION_OUTPUTS_LOADING = "session_outputs_loading",
	VIEWPORT_CREATION = "viewer_creation",
	EXPORT_REQUEST = "export_request",
}

/**
 * Definition of the session customization categories.
 * These categories are used to identify the category of a session customization task.
 */
export enum TASK_CATEGORY_SESSION_CUSTOMIZATION_CATEGORY {
	CUSTOMIZE = "customize",
	CUSTOMIZE_PARALLEL = "customize_parallel",
	CUSTOMIZE_VIA_EXPORTS = "customize_via_exports",
}

/**
 * Mapping of task categories.
 */
export const TASK_CATEGORY = {
	SESSION_CUSTOMIZATION: TASK_CATEGORY_SESSION_CUSTOMIZATION_CATEGORY,
} as const;

/**
 * Definition of the task category types.
 */
export type TaskCategoryTypes =
	(typeof TASK_CATEGORY)[keyof typeof TASK_CATEGORY][keyof (typeof TASK_CATEGORY)[keyof typeof TASK_CATEGORY]];

// #endregion Enums (1)
