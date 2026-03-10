export interface ITreeNodeData {
	/**
	 * The converted object of the tree node.
	 */
	convertedObject: {[key: string]: unknown};

	/**
	 * The ID of the tree node data.
	 */
	id: string;

	/**
	 * The updateVersion functions of all parents of the tree node data.
	 */
	parentsUpdateVersions: {
		[key: string]: () => void;
	};

	/**
	 * The update callback for the tree node data.
	 * This callback is called when the node is updated, e.g. when the version changes.
	 */
	updateCallback: ((newVersion: string, oldVersion: string) => void) | null;

	/**
	 * The update callback for the converted object of the tree node.
	 */
	updateCallbackConvertedObject:
		| ((newObj: unknown, oldObj: unknown, viewport: string) => void)
		| null;

	/**
	 * The version of the tree node data.
	 * If the version changes, the node data will be marked for an update.
	 * A version change can be triggered via {@link updateVersion}.
	 */
	version: string;

	/**
	 * Clones this node tree data.
	 */
	clone(): ITreeNodeData;

	/**
	 * Update the version.
	 */
	updateVersion(): void;
}
