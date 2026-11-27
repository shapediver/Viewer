import {
	GeometryData,
	type ITreeNode,
	type ITreeNodeData,
	MaterialStandardData,
	SDTFItemData,
	SDTFOverviewData,
} from "@shapediver/viewer.shared.node-tree";
import {InputValidator} from "@shapediver/viewer.shared.services";
import {
	type IMaterialAbstractData,
	type ISDTFOverview,
} from "@shapediver/viewer.shared.types";
import {mat4} from "gl-matrix";
import {RenderingEngine} from "../..";

const inputValidator = InputValidator.instance;

export const collectSDTFItemData = (
	node: ITreeNode,
): SDTFItemData | undefined => {
	for (let i = 0, len = node.data.length; i < len; i++)
		if (node.data[i] instanceof SDTFItemData)
			return <SDTFItemData>node.data[i];

	if (!node.parent) return;
	return collectSDTFItemData(node.parent);
};

export const createSDTFOverview = (node: ITreeNode): ISDTFOverview => {
	const out: SDTFOverviewData = new SDTFOverviewData({});

	node.traverseData((d) => {
		if (d instanceof SDTFOverviewData) {
			out.merge(<SDTFOverviewData>d);
		}
	});

	return out.overview;
};

/**
 * The overview merged from the given overview items, as
 * {@link createSDTFOverview} merges those of a tree.
 */
export const mergeSDTFOverviews = (
	items: readonly SDTFOverviewData[],
): ISDTFOverview => {
	const out: SDTFOverviewData = new SDTFOverviewData({});
	for (const item of items) out.merge(item);
	return out.overview;
};

export const injectAttributeData = (
	renderingEngine: RenderingEngine,
	currentSDTFOverview: ISDTFOverview,
	node: ITreeNode,
	data: ITreeNodeData,
) => {
	const itemData = collectSDTFItemData(node);
	const visData: {
		material: IMaterialAbstractData;
		matrix: mat4;
	} = {
		material: new MaterialStandardData({
			color: renderingEngine.defaultMaterialColor,
			opacity: 1,
		}),
		matrix: mat4.create(),
	};

	if (renderingEngine.visualizeAttributes) {
		const userVisData = renderingEngine.visualizeAttributes(
			currentSDTFOverview,
			itemData,
		);
		inputValidator.validateAndError(
			"Viewer.visualizeAttributes",
			userVisData,
			"object",
			true,
		);
		inputValidator.validateAndError(
			"Viewer.visualizeAttributes",
			userVisData.matrix,
			"mat4",
			true,
		);
		visData.material = userVisData.material;
		visData.matrix = userVisData.matrix;
	}

	// One entry per node. Every conversion used to push another one, and
	// leaving the mode removed only one of them.
	const existing = node.getTransformation("sdtf");
	if (existing) existing.matrix = visData.matrix;
	else
		node.addTransformation({
			id: "sdtf",
			matrix: visData.matrix,
		});

	if (data instanceof GeometryData) data.attributeMaterial = visData.material;
};
