import {
	DraggingParameterValue,
	ISessionApi,
	ITreeNode,
	OutputApiData,
	SessionApiData,
} from "@shapediver/viewer";
import {mat4, vec3} from "gl-matrix";
import {InteractionData} from "../InteractionData";

// #region Type aliases (2)

/**
 * Type declaration for a filter pattern used to hierarchically filter nodes of the scene tree by name.
 */
export type NodeNameFilterPattern = string[];
/**
 * Dictionary type declaration for filter patterns used to filter nodes of the scene tree by name.
 * The dictionary keys correspond to the IDs of outputs of a ShapeDiver model.
 * The dictionary values are arrays of patterns for hierarchical matching of node names of the output.
 * Each pattern is defined by an array of strings, which represent regular expressions
 * that are applied to nodes of the hierarchy.
 *
 * Example (simplified, disregarding the regular expression syntax):
 * ```json
 * {
 *    "OUTPUT_ID": [
 * 	 	["Node_a", "Node_b"], // matches nodes with the name "Node_a.Node_b" in the output with the ID "OUTPUT_ID"
 * 	 	["Node_a", "Node_c"], // matches nodes with the name "Node_a.Node_c" in the output with the ID "OUTPUT_ID"
 * 	 	["Node_a", "Node_d", "Node_e"] // matches nodes with the name "Node_a.Node_d.Node_e" in the output with the ID "OUTPUT_ID"
 *   ]
 * }
 *
 */
export type OutputNodeNameFilterPatterns = {
	[outputId: string]: NodeNameFilterPattern[];
};

// #endregion Type aliases (2)

// #region Variables (9)

/**
 * The black list of node names that should be ignored.
 *
 * These node names will be ignored when checking the node names.
 * These names are used in the ShapeDiver GH plugin for certain operations.
 */
const NODE_NAME_BLACKLIST = ["TransformZUpToYUp", "no_transformations"];
/**
 * Recurse the scene tree downwards starting from the given node, gather all nodes that match the pattern,
 * and add them to the result array.
 *
 * @param node The node to start traversing from. Typically this is the node of an output of a ShapeDiver model.
 * @param pattern The hierarchical pattern to check for.
 *                Each string of the pattern represents a regular expression for matching the node name.
 * @param outputApiName The name of the output API to be used for the concatenated node name.
 * @param result The result object, matching nodes will be added here.
 * @param count The current index into the pattern array.
 */
export const gatherNodesForPattern = (
	node: ITreeNode,
	pattern: NodeNameFilterPattern,
	outputApiName: string,
	result: {[nodeId: string]: {node: ITreeNode; name: string}},
	count: number = 0,
	strictNaming: boolean = true,
): void => {
	const nodeName = strictNaming
		? node.originalName
		: node.originalName || node.name;
	// escape special characters in the pattern
	const escapedTest = pattern[count]?.replace(
		/(?<!\.)\*(?!\*)|[+?^${}()|[\]\\]/g,
		"\\$&",
	);

	// if the node has no original name (was not given a name in Grasshopper) or
	// its name matches the black list, do not consider it for pattern matching
	if (!nodeName || NODE_NAME_BLACKLIST.includes(nodeName)) {
		for (const child of node.children) {
			gatherNodesForPattern(
				child,
				pattern,
				outputApiName,
				result,
				count,
				strictNaming,
			);
		}
	}
	// if the original name matches the pattern, check the children
	else if (nodeName && new RegExp(`^${escapedTest}$`).test(nodeName)) {
		if (count === pattern.length - 1) {
			let nodeData = getNodeData(node, strictNaming);

			if (!nodeData) {
				nodeData = getInstanceNodeData(node, strictNaming);
			}

			// we reached the end of the pattern, add the node to the result
			result[node.id] = {
				node,
				name: outputApiName + "." + nodeData?.nodeName || "",
			};
		} else {
			for (const child of node.children) {
				gatherNodesForPattern(
					child,
					pattern,
					outputApiName,
					result,
					count + 1,
					strictNaming,
				);
			}
		}
	}
};
/**
 * Convert the user-defined name-filters to filter patterns as used by useNodeInteractionData.
 *
 * The name filter is an array of dot-separated strings.
 * Each string represents a pattern to hierarchically match node names.
 * The first part of the pattern is the output name.
 * The rest of the pattern correspond to hierarchical node names, which may contain the "*"
 * character as a wildcard to match any node name or any part of the node name.
 *
 * @param nameFilter The user-defined name filters to convert.
 * @param outputIdsToNamesMapping A mapping of output IDs to output names for the session to be used.
 *
 * @returns The filter pattern object to be used with useNodeInteractionData, useSelection, and other interaction hooks.
 */
export const convertUserDefinedNameFilters = (
	nameFilter: string[],
	outputIdsToNamesMapping: {[key: string]: string},
): OutputNodeNameFilterPatterns => {
	const patterns: OutputNodeNameFilterPatterns = {};

	// we iterate over the name filter array
	// we store the result with the output ID as the key and an array of patterns as the value
	for (let i = 0; i < nameFilter.length; i++) {
		const parts = nameFilter[i].split(".");
		const outputName = parts[0];

		// replace the "*" with ".*" to create a regex pattern
		// if it's not already a ".*" pattern
		const outputNameRegex = new RegExp(
			`^${outputName.replace(/(?<!\.)\*(?!\*)/g, ".*")}$`,
		);
		// find the IDs of outputs whose names match
		const outputIds = Object.entries(outputIdsToNamesMapping)
			.filter(([, name]) => outputNameRegex.test(name))
			.map(([id]) => id);

		// create a regex pattern from the other parts of the array
		// replace all "*" with ".*"
		const patternArray = parts
			.slice(1)
			.map((part) => part.replace(/(?<!\.)\*(?!\*)/g, ".*"));

		// we iterate over the output mappings
		for (const outputId of outputIds) {
			// store the pattern in the pattern object
			if (!patterns[outputId]) patterns[outputId] = [];
			patterns[outputId].push(patternArray);
		}
	}

	return patterns;
};

/**
 * Convert the user-defined name-filters to filter patterns as used by useNodeInteractionData.
 *
 * The name filter is an array of dot-separated strings.
 * Each string represents a pattern to hierarchically match node names.
 * The first part of the pattern is the instance ID.
 * The rest of the pattern correspond to hierarchical node names, which may contain the "*"
 * character as a wildcard to match any node name or any part of the node name.
 *
 * @param nameFilter The user-defined name filters to convert.
 * @param instanceIds The IDs of the instances to be used.
 *
 * @returns The filter pattern object to be used with useNodeInteractionData, useSelection, and other interaction hooks.
 */
export const convertUserDefinedNameFiltersForInstances = (
	nameFilter: string[],
	instanceIds: string[],
): OutputNodeNameFilterPatterns => {
	const patterns: OutputNodeNameFilterPatterns = {};

	// we iterate over the name filter array
	// we store the result with the output ID as the key and an array of patterns as the value
	for (let i = 0; i < nameFilter.length; i++) {
		const parts = nameFilter[i].split(".");

		// escape special characters in the instance ID
		const escaped = parts[0].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
		// replace the "*" with ".*" to create a regex pattern
		// if it's not already a ".*" pattern
		const instanceIdRegex = new RegExp(
			`^${escaped.replace(/(?<!\.)\*(?!\*)/g, ".*")}$`,
		);
		// find the instance IDs that match the pattern
		const matchingInstanceIds = instanceIds.filter((id) =>
			instanceIdRegex.test(id),
		);

		// create a regex pattern from the other parts of the array
		// replace all "*" with ".*"
		const patternArray = parts
			.slice(1)
			.map((part) => part.replace(/(?<!\.)\*(?!\*)/g, ".*"));

		// we iterate over the output mappings
		for (const instanceId of matchingInstanceIds) {
			// store the pattern in the pattern object
			if (!patterns[instanceId]) patterns[instanceId] = [];
			patterns[instanceId].push(patternArray);
		}
	}

	return patterns;
};

/**
 * Traverse the node hierarchy upwards to find the node that corresponds to an output
 * of the ShapeDiver model.
 * Return the node itself, the corresponding output id and name, and the original names
 * concatenated using dots.
 *
 * @param node The node to start the upwards traversal from.
 * @returns
 */
export const getNodeData = (
	node: ITreeNode,
	strictNaming: boolean = true,
):
	| {
			outputId: string;
			outputName?: string;
			nodeName: string;
	  }
	| undefined => {
	const names: string[] = [];
	let tempNode = node;
	while (tempNode && tempNode.parent) {
		// look for the output API data in the node
		let outputApi = (
			tempNode.data.find((data) => data instanceof OutputApiData) as
				| OutputApiData
				| undefined
		)?.api;
		if (!outputApi) {
			// try to find it in the session api
			const sessionApi = (
				tempNode.parent?.data.find(
					(data) => data instanceof SessionApiData,
				) as SessionApiData | undefined
			)?.api;
			outputApi = sessionApi?.outputs[tempNode.name];
		}

		const nodeName = strictNaming
			? tempNode.originalName
			: tempNode.originalName || tempNode.name;
		if (outputApi) {
			return {
				outputId: outputApi.id,
				outputName: outputApi.name,
				nodeName: names.reverse().join("."),
			};
		} else if (nodeName && !NODE_NAME_BLACKLIST.includes(nodeName)) {
			names.push(nodeName);
		}

		tempNode = tempNode.parent;
	}
};

/**
 * Traverse the node hierarchy upwards to find the node that corresponds to an instance node.
 * Return the instance id, and the original names concatenated using dots.
 *
 * We know that it is an instance node if it has a session API data in its parent.
 * We return the instanceId as the outputId to be used in the other functions.
 *
 * @param node
 * @param strictNaming
 * @returns
 */
export const getInstanceNodeData = (
	node: ITreeNode,
	strictNaming: boolean = true,
): {outputId: string; nodeName: string} | undefined => {
	const names: string[] = [];
	let tempNode = node;
	while (tempNode && tempNode.parent) {
		// try to find it in the session api
		// if there is one, we know that this node is an instance node
		const sessionApi = (
			tempNode.parent?.data.find(
				(data) => data instanceof SessionApiData,
			) as SessionApiData | undefined
		)?.api;

		const nodeName = strictNaming
			? tempNode.originalName
			: tempNode.originalName || tempNode.name;
		if (sessionApi) {
			return {
				outputId: nodeName!,
				nodeName: names.reverse().join("."),
			};
		} else if (nodeName && !NODE_NAME_BLACKLIST.includes(nodeName)) {
			names.push(nodeName);
		}

		tempNode = tempNode.parent;
	}
};

/**
 * Try to match the given node with the patterns.
 * In case of a match, return the concatenated name of the node as required
 * for setting values of interaction parameters.
 *
 * @param patterns
 * @param node
 * @returns
 */
const matchNodeWithPatterns = (
	patterns: OutputNodeNameFilterPatterns,
	node: ITreeNode,
	strictNaming: boolean,
): string | undefined => {
	let nodeData = getNodeData(node, strictNaming);
	if (!nodeData) {
		nodeData = getInstanceNodeData(node, strictNaming);
	}
	if (!nodeData) return;
	const {outputId, outputName, nodeName} = nodeData;

	// check if the path matches the pattern and return the first match
	for (const pattern of patterns[outputId] ?? []) {
		if (pattern.length === 0) {
			// special case, just the output name was provided
			return outputName || outputId;
		} else {
			// escape special characters in the pattern
			const cleanedPattern = pattern
				.join(".")
				.replace(/(?<!\.)\*(?!\*)|[+?^${}()|[\]\\]/g, "\\$&");
			// create a regex pattern from the pattern array, match the original name
			const match = nodeName.match(`^${cleanedPattern}$`);
			if (match) return (outputName || outputId) + "." + match[0];
		}
	}
};
/**
 * Try to match the given nodes with the patterns.
 * For matching nodes, return the concatenated names of the nodes as required
 * for setting values of interaction parameters.
 *
 * @param patterns The patterns to match the node names.
 * @param nodes The nodes to process.
 * @returns The concatenated names of the nodes that match the pattern.
 */
export const matchNodesWithPatterns = (
	patterns: OutputNodeNameFilterPatterns,
	nodes: ITreeNode[],
	strictNaming: boolean = true,
): string[] => {
	// we iterate over the nodes and get the output and node names
	const nodeNames: string[] = [];
	nodes.forEach((node) => {
		const result = matchNodeWithPatterns(patterns, node, strictNaming);
		if (result) nodeNames.push(result);
	});

	return nodeNames;
};
/**
 * Add interaction data to the node.
 *
 * If the node already has interaction data, the function will remove the interaction data and add the new interaction data.
 * Then the function will update the version of the node.
 *
 * @param node
 * @param interactionDataSettings
 */
export const addInteractionData = (
	node: ITreeNode,
	interactionDataSettings: {
		select?: boolean;
		hover?: boolean;
		drag?: boolean;
		dragOrigin?: vec3;
		dragAnchors?: {
			id: string;
			position: vec3;
			rotation?: {angle: number; axis: vec3};
		}[];
	},
	componentId: string,
) => {
	for (const data of node.data) {
		// remove existing interaction data if it is restricted to the current component
		if (
			data instanceof InteractionData &&
			data.restrictedManagers.includes(componentId)
		) {
			console.warn(
				`Node ${node.id} already has interaction data with id ${data.id}, removing it.`,
			);
			node.removeData(data);
		}
	}

	// add the interaction data to the node
	const interactionData = new InteractionData(
		interactionDataSettings,
		undefined,
		[componentId],
	);
	node.addData(interactionData);
	node.updateVersion();

	if (interactionDataSettings.dragOrigin)
		interactionData.dragOrigin = interactionDataSettings.dragOrigin;
	if (interactionDataSettings.dragAnchors)
		interactionData.dragAnchors = interactionDataSettings.dragAnchors;
};
/**
 * Get the nodes within the session API by their names.
 *
 * @param sessionApi The session API.
 * @param names The names of the nodes.
 * @returns
 */
export const getNodesByName = (
	sessionApis: ISessionApi[],
	names: string[],
	strictNaming = true,
): {name: string; node: ITreeNode}[] => {
	const nodes: {name: string; node: ITreeNode}[] = [];

	for (const sessionApi of sessionApis) {
		names.forEach((name) => {
			const parts = name.split(".");
			const outputName = parts[0];

			const outputApis = sessionApi.getOutputByName(outputName);
			outputApis.forEach((outputApi) => {
				if (!outputApi || !outputApi.node) return;
				if (
					outputApi.format.length === 1 &&
					outputApi.format[0] === "material"
				)
					return;

				if (parts.length === 1) {
					nodes.push({
						name: name,
						node: outputApi.node,
					});
				} else {
					outputApi.node.traverse((n) => {
						if (
							checkNodeNameMatch(
								n,
								parts.slice(1).join("."),
								strictNaming,
							)
						) {
							nodes.push({
								name: name,
								node: n,
							});
						}
					});
				}
			});
		});
	}

	return nodes;
};
// react to changes of the uiValue and update the selection state if necessary
export const calculateCombinedDraggedNodes = (
	currentState: DraggingParameterValue["objects"],
	draggedNodes: DraggingParameterValue["objects"],
): DraggingParameterValue["objects"] => {
	const allDraggedNodesCopy = [...currentState];

	for (const draggedNode of draggedNodes) {
		const index = allDraggedNodesCopy.findIndex(
			(n) => n.name === draggedNode.name,
		);

		if (index === -1) {
			allDraggedNodesCopy.push({
				name: draggedNode.name,
				transformation: draggedNode.transformation,
				dragAnchorId: draggedNode.dragAnchorId,
				restrictionId: draggedNode.restrictionId,
			});
		} else {
			const oldDraggedNode = allDraggedNodesCopy[index];

			// multiply the matrices
			const newMatrix = mat4.multiply(
				mat4.create(),
				mat4.fromValues(
					...(draggedNode.transformation as [
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
					]),
				),
				mat4.fromValues(
					...(oldDraggedNode.transformation as [
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
						number,
					]),
				),
			);

			allDraggedNodesCopy[index] = {
				name: draggedNode.name,
				transformation: Array.from(newMatrix),
				dragAnchorId: draggedNode.dragAnchorId,
				restrictionId: draggedNode.restrictionId,
			};
		}
	}

	return allDraggedNodesCopy;
};

/**
 * This function checks if the name of the node matches the given name.
 * The name is provided without the display component in the beginning.
 * It is assumed that the node is in the correct display component.
 *
 * @param node
 * @param nameWithoutDisplayComponent
 */
export const checkNodeNameMatch = (
	node: ITreeNode,
	nameWithoutDisplayComponent: string,
	strictNaming: boolean = true,
): boolean => {
	if (strictNaming) {
		let originalNamePath = node.getOriginalNamePath();
		NODE_NAME_BLACKLIST.forEach((name) => {
			originalNamePath = originalNamePath.replace(name, "");
		});
		// match the dot-separated name at the end of the original name path
		const match = originalNamePath.match(/([^.]+(\.[^.]+)*)\.*$/);
		if (!match) return false;
		return match[0] === nameWithoutDisplayComponent;
	} else {
		let namePath = node.getPath();
		NODE_NAME_BLACKLIST.forEach((name) => {
			namePath = namePath.replace(name, "");
		});

		return namePath.endsWith(nameWithoutDisplayComponent);
	}
};

// #endregion Variables (9)
